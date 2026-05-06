import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type { PackageEvent, PackageRecord, PackageSource, PackageStatus } from "../domain/types.js";

const CARD_SELECTORS = [
  "[data-package-card]",
  "[data-parcel-card]",
  ".package-card",
  ".parcel-card",
  ".order-card",
  ".logistics-card"
].join(",");

export function parsePackageCards(html: string, source: PackageSource): PackageRecord[] {
  const $ = cheerio.load(html);
  const records: PackageRecord[] = [];

  $(CARD_SELECTORS).each((_, element) => {
    const card = $(element);
    const title = textOf($, card, ["[data-title]", ".package-title", ".parcel-title", ".order-title"]);
    const statusText = textOf($, card, ["[data-status]", ".package-status", ".parcel-status", ".order-status"]);
    const trackingNumber = textOf($, card, [
      "[data-tracking-number]",
      ".tracking-number",
      ".mail-no",
      ".waybill-code"
    ]);
    const carrier = textOf($, card, ["[data-carrier]", ".package-carrier", ".carrier"]);
    const orderId = card.attr("data-order-id") ?? textOf($, card, ["[data-order-id]", ".order-id"]);
    const packageUrl = attrOf($, card, ["[data-package-url]", "a[href*='logistics']", "a[href*='track']"], "href");
    const lastUpdatedAt =
      attrOf($, card, ["[data-last-updated]", ".last-updated", "time"], "datetime") ??
      textOf($, card, ["[data-last-updated]", ".last-updated"]);
    const events = parseEvents($, card);
    const status = toPackageStatus(statusText);
    const deliveredAt = status === "delivered" ? events[0]?.time ?? lastUpdatedAt : undefined;

    records.push({
      id: card.attr("data-id") ?? stablePackageId(source, orderId, trackingNumber, title),
      source,
      title: title || "Unknown package",
      status,
      trackingNumber: trackingNumber || undefined,
      carrier: carrier || undefined,
      orderId: orderId || undefined,
      packageUrl: packageUrl || undefined,
      lastEvent: events[0]?.description || statusText || undefined,
      lastUpdatedAt: lastUpdatedAt || events[0]?.time,
      deliveredAt,
      events,
      raw: {
        statusText
      }
    });
  });

  return records;
}

export function toPackageStatus(text: string): PackageStatus {
  const normalized = text.trim().toLowerCase();

  if (containsAny(normalized, ["待发货", "等待卖家发货", "pending shipment"])) {
    return "pending_shipment";
  }

  if (containsAny(normalized, ["派送中", "正在派送", "out for delivery"])) {
    return "out_for_delivery";
  }

  if (containsAny(normalized, ["已签收", "已收货", "交易成功", "已完成", "delivered", "signed"])) {
    return "delivered";
  }

  if (containsAny(normalized, ["异常", "失败", "滞留", "exception", "failed"])) {
    return "exception";
  }

  if (containsAny(normalized, ["运输", "已发货", "已揽收", "transit", "shipped", "picked up"])) {
    return "in_transit";
  }

  return "unknown";
}

function parseEvents($: CheerioAPI, card: Cheerio<AnyNode>): PackageEvent[] {
  const events: PackageEvent[] = [];

  card.find("[data-event], .event, .trace-item, .logistics-event").each((_, element) => {
    const event = $(element);
    const description = collapseWhitespace(event.text());
    if (!description) {
      return;
    }

    events.push({
      time: event.attr("data-time") ?? event.find("time").attr("datetime") ?? undefined,
      description
    });
  });

  return events;
}

function textOf($: CheerioAPI, root: Cheerio<AnyNode>, selectors: string[]): string {
  for (const selector of selectors) {
    const node = root.find(selector).first();
    if (node.length > 0) {
      const text = collapseWhitespace(node.text());
      if (text) {
        return text;
      }
    }
  }

  return "";
}

function attrOf(
  $: CheerioAPI,
  root: Cheerio<AnyNode>,
  selectors: string[],
  attribute: string
): string | undefined {
  for (const selector of selectors) {
    const node = root.find(selector).first();
    const value = node.attr(attribute);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stablePackageId(
  source: PackageSource,
  orderId: string | undefined,
  trackingNumber: string,
  title: string
): string {
  const material = [source, orderId, trackingNumber, title].filter(Boolean).join(":");
  const hash = createHash("sha1").update(material || `${source}:unknown`).digest("hex").slice(0, 12);
  return `${source}-${hash}`;
}
