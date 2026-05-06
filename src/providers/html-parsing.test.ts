import { describe, expect, it } from "vitest";
import { parsePackageCards, toPackageStatus } from "./html-parsing.js";

describe("toPackageStatus", () => {
  it.each([
    ["待发货", "pending_shipment"],
    ["运输中", "in_transit"],
    ["派送中", "out_for_delivery"],
    ["已签收", "delivered"],
    ["物流异常", "exception"]
  ] as const)("maps %s to %s", (text, status) => {
    expect(toPackageStatus(text)).toBe(status);
  });
});

describe("parsePackageCards", () => {
  it("parses Taobao package cards from stable selectors", () => {
    const html = `
      <article data-package-card data-id="tb-1001" data-order-id="order-1">
        <h3 data-title>Keyboard</h3>
        <span data-status>运输中</span>
        <span data-carrier>圆通速递</span>
        <span data-tracking-number>YT123</span>
        <a data-package-url href="https://buyertrade.taobao.com/logistics.htm?id=order-1">detail</a>
        <time data-last-updated datetime="2026-05-06T08:00:00.000+08:00">today</time>
        <ol>
          <li data-event data-time="2026-05-06T08:00:00.000+08:00">到达上海转运中心</li>
          <li data-event data-time="2026-05-05T18:00:00.000+08:00">已揽收</li>
        </ol>
      </article>
    `;

    const records = parsePackageCards(html, "taobao");

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: "tb-1001",
      source: "taobao",
      title: "Keyboard",
      status: "in_transit",
      carrier: "圆通速递",
      trackingNumber: "YT123",
      orderId: "order-1",
      lastEvent: "到达上海转运中心"
    });
    expect(records[0].events).toHaveLength(2);
  });

  it("parses JD package cards and marks delivered time", () => {
    const html = `
      <section class="package-card" data-id="jd-2001">
        <div class="package-title">Coffee beans</div>
        <div class="package-status">已签收</div>
        <div class="package-carrier">京东物流</div>
        <div class="tracking-number">JD123</div>
        <time class="last-updated" datetime="2026-05-06T10:00:00.000+08:00">today</time>
        <div class="events">
          <p class="event" data-time="2026-05-06T10:00:00.000+08:00">本人签收</p>
        </div>
      </section>
    `;

    const records = parsePackageCards(html, "jd");

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: "jd-2001",
      source: "jd",
      title: "Coffee beans",
      status: "delivered",
      carrier: "京东物流",
      trackingNumber: "JD123",
      deliveredAt: "2026-05-06T10:00:00.000+08:00"
    });
  });

  it("parses Taobao bought-list order containers from the real page structure", () => {
    const html = `
      <div id="shopOrderContainer_3299970000089003896" class="trade-bought-list-order-container">
        <span class="shopInfoOrderTime--abc">2026-05-04</span>
        <span class="shopInfoOrderId--abc">订单号: 3299970000089003896</span>
        <a class="shopInfoName--abc">迈金运动户外旗舰店</a>
        <span class="shopInfoStatus--abc">卖家已发货</span>
        <span class="titleText--abc">码表配件/自行车码表座</span>
        <div>运输中预计今天送达</div>
        <div>确认收货</div>
        <div>查看物流</div>
      </div>
    `;

    const records = parsePackageCards(html, "taobao");

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: "taobao-3299970000089003896",
      source: "taobao",
      title: "码表配件/自行车码表座",
      status: "in_transit",
      orderId: "3299970000089003896",
      lastEvent: "运输中预计今天送达",
      lastUpdatedAt: "2026-05-04"
    });
  });
});
