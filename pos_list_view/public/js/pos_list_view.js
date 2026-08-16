// POS List View
// Adds a Grid <-> List switch to the ERPNext Point of Sale.
//
// Design rules:
//   1. The standard ERPNext GRID view is never touched. Custom markup is
//      emitted only while in list mode; grid always falls through to core
//      get_item_html(), and every style rule below is scoped to
//      ".items-container.plv-list" so nothing can leak into grid.
//   2. The switch lives in the page header, next to the 3-dot menu.

(function () {
	const PAGE = "point-of-sale";
	const STORAGE_KEY = "pos_list_view:mode";
	const GRID = "grid";
	const LIST = "list";
	const LIST_CLASS = "plv-list";

	// Shown when an item has no image at all.
	const PLACEHOLDER_ICON = `<svg class="plv-thumb-icon" viewBox="0 0 24 24" fill="none"
		stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
		aria-hidden="true">
		<rect x="3" y="3" width="18" height="18" rx="2.5"/>
		<circle cx="8.75" cy="8.75" r="1.5"/>
		<path d="M21 15.5l-4.6-4.6L5.5 21.5"/></svg>`;

	let page_wrapper = null;

	function get_saved_mode() {
		try {
			return localStorage.getItem(STORAGE_KEY) === LIST ? LIST : GRID;
		} catch (e) {
			return GRID;
		}
	}

	function save_mode(mode) {
		try {
			localStorage.setItem(STORAGE_KEY, mode);
		} catch (e) {
			/* storage disabled - still works for this session */
		}
	}

	function inject_styles() {
		if (document.getElementById("plv-styles")) return;
		const style = document.createElement("style");
		style.id = "plv-styles";
		style.textContent = `
		/* ---------- switch (page header, beside the 3-dot menu) ---------- */
		.plv-toggle {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			margin-right: 8px;
			user-select: none;
			vertical-align: middle;
		}
		.plv-toggle .plv-lbl {
			font-size: var(--text-sm, 12px);
			font-weight: 500;
			color: var(--text-muted, #8d99a6);
			transition: color 120ms ease;
		}
		.plv-toggle .plv-lbl.active { color: var(--text-color, #1f272e); }
		.plv-toggle .plv-switch {
			position: relative;
			width: 44px; height: 24px;
			flex: 0 0 44px;
			border: 0; padding: 0;
			border-radius: 999px;
			cursor: pointer;
			background-color: var(--gray-400, #c0c8d0);
			transition: background-color 150ms ease;
		}
		.plv-toggle .plv-switch[aria-checked="true"] {
			background-color: var(--gray-900, #1f272e);
		}
		.plv-toggle .plv-switch:focus-visible {
			outline: 2px solid var(--primary, #2490ef);
			outline-offset: 2px;
		}
		.plv-toggle .plv-knob {
			position: absolute; top: 3px; left: 3px;
			width: 18px; height: 18px;
			border-radius: 50%;
			background: #fff;
			box-shadow: 0 1px 3px rgba(0,0,0,.25);
			transition: transform 150ms ease;
		}
		.plv-toggle .plv-switch[aria-checked="true"] .plv-knob { transform: translateX(20px); }

		/* ---------- list container (overrides the core grid) ---------- */
		.items-container.${LIST_CLASS} {
			display: flex !important;
			flex-direction: column;
			gap: 8px;
			padding: 4px 2px 8px !important;
		}

		/* ---------- list row ---------- */
		.items-container.${LIST_CLASS} > .item-wrapper {
			display: flex;
			align-items: center;
			gap: 12px;
			width: 100%;
			height: auto;
			min-height: 56px;
			margin: 0;
			padding: 10px 16px;
			border: 1px solid var(--border-color, #e2e3e5);
			border-radius: var(--border-radius-md, 8px);
			box-shadow: none;
			background-color: var(--fg-color, #fff);
			cursor: pointer;
			transition: border-color 120ms ease, background-color 120ms ease;
		}
		.items-container.${LIST_CLASS} > .item-wrapper:hover {
			background-color: var(--control-bg, #f4f5f6);
			border-color: var(--gray-400, #c0c8d0);
			transform: none;
		}
		.items-container.${LIST_CLASS} .plv-thumb {
			flex: 0 0 40px;
			width: 40px; height: 40px;
			display: flex; align-items: center; justify-content: center;
			overflow: hidden;
			border-radius: var(--border-radius-md, 6px);
			background-color: var(--control-bg, #f4f5f6);
			color: var(--text-muted, #8d99a6);
		}
		.items-container.${LIST_CLASS} .plv-thumb img {
			width: 100%; height: 100%; object-fit: cover; display: block;
		}
		.items-container.${LIST_CLASS} .plv-thumb-icon { width: 20px; height: 20px; }
		.items-container.${LIST_CLASS} .plv-thumb-abbr {
			font-size: var(--text-sm, 12px);
			font-weight: 600;
			letter-spacing: .02em;
			color: var(--text-muted, #8d99a6);
		}
		.items-container.${LIST_CLASS} .plv-info { flex: 1 1 auto; min-width: 0; }
		.items-container.${LIST_CLASS} .plv-name {
			font-size: var(--text-base, 14px);
			font-weight: 600;
			color: var(--text-color, #1f272e);
			white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		}
		.items-container.${LIST_CLASS} .plv-price {
			margin-top: 3px;
			font-size: var(--text-base, 14px);
			font-weight: 600;
			color: var(--text-color, #1f272e);
			white-space: nowrap;
		}
		.items-container.${LIST_CLASS} .plv-pill {
			flex: 0 0 auto;
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 4px 10px;
			border-radius: 999px;
			font-size: var(--text-sm, 12px);
			font-weight: 600;
			white-space: nowrap;
		}
		.items-container.${LIST_CLASS} .plv-dot {
			width: 6px; height: 6px; border-radius: 50%;
			background-color: currentColor;
		}
		.items-container.${LIST_CLASS} .plv-pill.green {
			background-color: var(--bg-green, #e8f5ec);
			color: var(--text-on-green, #17825b);
		}
		.items-container.${LIST_CLASS} .plv-pill.orange {
			background-color: var(--bg-orange, #fdf3e6);
			color: var(--text-on-orange, #b25e02);
		}
		.items-container.${LIST_CLASS} .plv-pill.red {
			background-color: var(--bg-red, #fdeaea);
			color: var(--text-on-red, #c4342b);
		}
		.items-container.${LIST_CLASS} .plv-pill.gray {
			background-color: var(--control-bg, #f4f5f6);
			color: var(--text-muted, #8d99a6);
		}
		`;
		document.head.appendChild(style);
	}

	function patch_item_selector() {
		const ItemSelector = window.erpnext && erpnext.PointOfSale && erpnext.PointOfSale.ItemSelector;
		if (!ItemSelector) return false;
		if (ItemSelector.prototype.__plv_patched) return true;
		ItemSelector.prototype.__plv_patched = true;

		// A broken image URL degrades to the item's initials rather than a torn icon.
		ItemSelector.prototype.plv_broken_image = function (img) {
			const abbr = frappe.utils.escape_html(frappe.get_abbr($(img).attr("alt") || ""));
			$(img).parent().html(`<span class="plv-thumb-abbr">${abbr}</span>`);
		};

		// --- list row markup (ours) ---
		ItemSelector.prototype.plv_row_html = function (item) {
			const esc = frappe.utils.escape_html;
			const {
				item_code,
				item_name,
				item_image,
				serial_no,
				batch_no,
				barcode,
				actual_qty,
				uom,
				stock_uom,
			} = item;
			const price_list_rate = item.price_list_rate;
			const precision = flt(price_list_rate, 2) % 1 != 0 ? 2 : 0;

			const safe_name = esc(item_name || item_code || "");
			const safe_uom = esc(uom || "");
			const price = esc(format_currency(price_list_rate, item.currency, precision) || 0);

			let pill;
			if (item.is_stock_item) {
				const cls = actual_qty > 10 ? "green" : actual_qty <= 0 ? "red" : "orange";
				let display = actual_qty;
				if (Math.round(display) > 999) display = (Math.round(display) / 1000).toFixed(1) + "K";
				pill = `<div class="plv-pill ${cls}"><span class="plv-dot"></span>${display}</div>`;
			} else {
				pill = `<div class="plv-pill gray">${__("Non stock")}</div>`;
			}

			// Image if the item has one, otherwise a neutral placeholder icon.
			// A broken URL degrades to the item's initials via plv_broken_image().
			const thumb = item_image
				? `<img src="${esc(item_image)}" alt="${safe_name}" loading="lazy"
						onerror="cur_pos.item_selector.plv_broken_image(this)">`
				: PLACEHOLDER_ICON;

			// data-* attributes mirror core get_item_html exactly - the core click
			// handler reads them to add the item to the cart.
			return `<div class="item-wrapper"
					data-item-code="${esc(item_code || "")}" data-serial-no="${esc(serial_no || "")}"
					data-batch-no="${esc(batch_no || "")}" data-uom="${safe_uom}"
					data-rate="${price_list_rate || 0}"
					data-stock-uom="${esc(stock_uom || "")}"
					data-barcode="${esc(barcode || "")}"
					title="${safe_name}">
					<div class="plv-thumb">${thumb}</div>
					<div class="plv-info">
						<div class="plv-name">${safe_name}</div>
						<div class="plv-price">${price} / ${safe_uom}</div>
					</div>
					${pill}
				</div>`;
		};

		// Swap markup ONLY in list mode. Grid always uses core rendering verbatim.
		const orig_get_item_html = ItemSelector.prototype.get_item_html;
		ItemSelector.prototype.get_item_html = function (item) {
			if (this.plv_mode === LIST) {
				try {
					return this.plv_row_html(item);
				} catch (e) {
					console.error("[pos_list_view] row render failed, using core markup", e);
				}
			}
			return orig_get_item_html.apply(this, arguments);
		};

		// Core's load_items_data() renders without ever setting this.items, so we
		// stash the last rendered set ourselves - otherwise toggling cannot
		// repaint and stale markup is left behind in the other mode.
		const orig_render_item_list = ItemSelector.prototype.render_item_list;
		ItemSelector.prototype.render_item_list = function (items) {
			this.plv_items = items;
			return orig_render_item_list.apply(this, arguments);
		};

		ItemSelector.prototype.plv_repaint = function () {
			const items = this.plv_items || this.items;
			if (items && items.length) {
				this.render_item_list(items);
				return;
			}
			// Nothing cached yet - refetch so we never leave the other mode's markup.
			try {
				const term = (this.search_field && this.search_field.get_value()) || "";
				this.filter_items({ search_term: term });
			} catch (e) {
				console.error("[pos_list_view] repaint failed", e);
			}
		};

		ItemSelector.prototype.plv_set_mode = function (mode, rerender) {
			this.plv_mode = mode === LIST ? LIST : GRID;
			save_mode(this.plv_mode);

			if (this.$items_container) {
				this.$items_container.toggleClass(LIST_CLASS, this.plv_mode === LIST);
			}

			const on = this.plv_mode === LIST;
			$(".plv-toggle").each(function () {
				$(this).find(".plv-switch").attr("aria-checked", on ? "true" : "false");
				$(this).find(".plv-lbl-grid").toggleClass("active", !on);
				$(this).find(".plv-lbl-list").toggleClass("active", on);
			});

			if (rerender !== false) this.plv_repaint();
		};

		const orig_prepare_dom = ItemSelector.prototype.prepare_dom;
		ItemSelector.prototype.prepare_dom = function () {
			orig_prepare_dom.apply(this, arguments);
			try {
				render_toggle(this);
				// Items have not loaded yet, so no repaint needed here.
				this.plv_set_mode(get_saved_mode(), false);
			} catch (e) {
				console.error("[pos_list_view] setup failed", e);
			}
		};

		return true;
	}

	// Toggle lives in the page header next to the 3-dot menu, not in the filter bar.
	function render_toggle(selector) {
		const page = page_wrapper && page_wrapper.page;
		const $actions = page && page.page_actions ? $(page.page_actions) : $(page_wrapper).find(".page-actions").first();
		if (!$actions.length || $actions.find(".plv-toggle").length) return;

		const on = get_saved_mode() === LIST;
		const $toggle = $(
			`<div class="plv-toggle">
				<span class="plv-lbl plv-lbl-grid ${on ? "" : "active"}">${__("Grid")}</span>
				<button type="button" class="plv-switch" role="switch"
					aria-checked="${on}" aria-label="${__("Toggle list view")}">
					<span class="plv-knob"></span>
				</button>
				<span class="plv-lbl plv-lbl-list ${on ? "active" : ""}">${__("List")}</span>
			</div>`
		);

		$toggle.on("click", ".plv-switch", function () {
			const sel = (window.cur_pos && cur_pos.item_selector) || selector;
			if (sel && sel.plv_set_mode) sel.plv_set_mode(sel.plv_mode === LIST ? GRID : LIST, true);
		});

		const $menu = $actions.find(".menu-btn-group");
		if ($menu.length) $toggle.insertBefore($menu);
		else $actions.prepend($toggle);
	}

	function init() {
		inject_styles();
		if (!patch_item_selector()) return;
		const sel = window.cur_pos && cur_pos.item_selector;
		if (sel && sel.plv_set_mode) {
			render_toggle(sel);
			sel.plv_set_mode(get_saved_mode(), true);
		}
	}

	const page = frappe.pages[PAGE];
	if (!page) return;

	const orig_on_page_load = page.on_page_load;
	page.on_page_load = function (wrapper) {
		page_wrapper = wrapper;
		if (orig_on_page_load) orig_on_page_load.apply(this, arguments);
		frappe.require("point-of-sale.bundle.js", init);
	};

	const orig_refresh = page.refresh;
	page.refresh = function (wrapper) {
		if (wrapper) page_wrapper = wrapper;
		if (orig_refresh) orig_refresh.apply(this, arguments);
		frappe.require("point-of-sale.bundle.js", init);
	};
})();
