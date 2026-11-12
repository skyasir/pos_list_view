## POS List View

A Grid ↔ List switch for the ERPNext **Point of Sale** item selector.

ERPNext's POS shows items as a grid of cards. On a canteen or kiosk menu with a
long item list, that means a lot of scrolling. This app adds a switch in the POS
page header that flips the item selector to a compact list — thumbnail, item
name, price/UOM and a stock-quantity pill per row.

### Features

- **Grid ↔ List switch** in the POS page header, beside the 3-dot menu
- **Compact list rows**: thumbnail, item name, price / UOM, colour-coded stock pill
  (green in stock, orange low, red out of stock)
- **Image fallbacks**: item image → neutral placeholder icon → item initials if the
  image URL is broken
- **Preference is remembered** per browser via `localStorage`, so each till keeps
  its own view
- **Cart, search and keyboard shortcuts are untouched** — list rows keep the
  `.item-wrapper` class and every `data-*` attribute the core POS click handler reads

### The standard Grid view is never modified

This is a deliberate design constraint:

- Custom markup is emitted **only** while in list mode. In grid mode
  `get_item_html()` falls through to ERPNext's core implementation verbatim.
- Every CSS rule is scoped to `.items-container.plv-list`, so no style can leak
  into the grid.

It also does not reuse ERPNext's built-in `hide-item-image` mode, which is a
different design (column header, no thumbnail) and is driven by the POS Profile
rather than a runtime toggle.

### Installation

```bash
bench get-app https://github.com/skyasir/pos_list_view.git
bench --site <your-site> install-app pos_list_view
bench --site <your-site> clear-cache
```

Then hard-refresh the browser (Cmd/Ctrl + Shift + R) — the POS page script is cached.

### Compatibility

Built and tested against ERPNext v16 / Frappe v16.

The app hooks the POS page through the standard `page_js` hook and patches
`erpnext.PointOfSale.ItemSelector` at runtime. It touches no ERPNext source
files, so it survives `bench update`.

### Licence

MIT

<!-- portfolio:start -->
---

<p align="center">
  <a href="https://yasirshaikh.in/?app=pos_list_view">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://yasirshaikh.in/files/yasir-logo-on-dark.svg">
      <img src="https://yasirshaikh.in/files/yasir-logo.svg" alt="Yasir Shaikh" height="64">
    </picture>
  </a>
</p>

<p align="center">
  Built by <a href="https://yasirshaikh.in/">Yasir Shaikh</a>, ERPNext consultant and Frappe developer.<br>
  <a href="https://yasirshaikh.in/?app=pos_list_view">See this app on my portfolio</a>
</p>
<!-- portfolio:end -->
