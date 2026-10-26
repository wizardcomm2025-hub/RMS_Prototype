// Wize Restaurant RMS — Recipe
// Semi-Finished and Finished Goods recipes, with ingredient costing.
(() => {
  // ---------- markup this module owns ----------
  const VIEW = `
  <div class="page-head">
    <div class="ph-txt">
      <h1>Recipe</h1>
      <p class="page-sub">Semi-Finished and Finished Goods recipes — recipe quantity, UOM, yield and ingredients.</p>
    </div>
  </div>
  <div class="info-strip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
    <span>A <b>Recipe</b> turns <a href="#rawmaterial">Raw Materials</a> and other Semi-Finished items into something you stock or sell, and its <a href="#category-master">Category</a> comes from Category Master. <b>Finished Goods</b> are sold on the POS, so they also need a <a href="#menu-section">Menu Section</a>, a POS unit &amp; conversion and a price. Cost is worked out from the ingredients, so raw material rates must be current.</span>
  </div>
  <div class="table-card">
    <div class="tbl-tools">
      <div class="toolbar-left">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input type="text" id="rcSearch" placeholder="Search recipe…" />
        </div>
        <div class="seg" id="rcTabs"></div>
      </div>
      <div class="tb-right">
        <button class="btn-ghost icon-only" id="rcRefresh" title="Refresh list"></button>
        <button class="btn-ghost" id="rcExport" title="Download the filtered rows as CSV">Export</button>
        <span class="tb-sep"></span>
        <button class="btn-primary" id="rcAddBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Recipe
        </button>
      </div>
    </div>
    <div class="tbl-wrap" id="rcWrap">
      <table class="g-table pin-2 rc-table">
        <thead><tr>
          <th class="pin-l">Actions</th>
          <th class="pin-n">Recipe Name</th><th>Type</th><th>Category</th><th>Menu Section</th><th>Output</th>
          <th class="num">Cost</th><th class="num">Price</th><th class="num">Food Cost</th>
        </tr></thead>
        <tbody id="rcBody"></tbody>
      </table>
    </div>
    <div class="tbl-foot"><span class="pg-info" id="rcInfo"></span><span id="rcSize"></span><div class="pagination" id="rcPagination"></div></div>
  </div>

`;
  const DIALOGS = `
<div class="overlay overlay-full" id="rcModal">
  <div class="modal modal-full">
    <div class="modal-head">
      <div>
        <h2 id="rcTitle">New Recipe</h2>
        <p class="head-sub" id="rcSubtitle">Fill in the details and ingredients. Cost is calculated automatically.</p>
      </div>
      <button data-rc-close title="Close (Esc)"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <form id="rcForm" autocomplete="off" style="display:contents">
      <div class="rc-body">
        <div class="rc-inner">
          <div class="rc-main">

            <section class="sec card">
              <div class="sec-head"><span class="step">1</span><div><h3>Recipe type</h3><p>Is this made for the kitchen, or sold to guests?</p></div></div>
              <div class="type-pick" id="rcType">
                <label data-t="SF"><input type="radio" name="rcType" value="SF" />
                  <span><b>Semi-Finished · Kitchen Prep</b><small>Made in the kitchen, stocked and used as an ingredient in other recipes (e.g. gravies, pastes, doughs). Not sold on the POS.</small></span></label>
                <label data-t="FG"><input type="radio" name="rcType" value="FG" />
                  <span><b>Finished Goods · Sold on POS</b><small>A dish or drink sold to guests (e.g. Paneer Butter Masala, Masala Chai). Also needs menu section, selling unit, price and image.</small></span></label>
              </div>
            </section>

            <section class="sec card">
              <div class="sec-head"><span class="step">2</span><div><h3>Name &amp; identification</h3><p>How staff find this recipe in lists, on the KOT and in reports.</p></div></div>
              <div class="grid g4">
                <div class="field fixed span2" id="rcNameField">
                  <input type="text" id="rcName" placeholder="e.g. Paneer Butter Masala" maxlength="60" />
                  <label for="rcName">Recipe Name *</label>
                  <div class="err-msg" id="rcNameErr"></div>
                  <div class="fhint">Full name shown in lists and reports.</div>
                </div>
                <div class="field fixed">
                  <input type="text" id="rcAlias" placeholder="e.g. PBM" maxlength="24" />
                  <label for="rcAlias">Short Name (for KOT)</label>
                  <div class="fhint">Printed on kitchen tickets and labels.</div>
                </div>
                <div class="field fixed" id="rcSkuField">
                  <input type="text" id="rcSku" placeholder="e.g. FG-PBM-01" maxlength="20" style="text-transform:uppercase" />
                  <label for="rcSku">SKU / Item Code</label>
                  <div class="err-msg" id="rcSkuErr"></div>
                  <div class="fhint">Optional. Must be unique.</div>
                </div>
                <div class="field fixed">
                  <input type="text" id="rcNumber" placeholder="e.g. 101" maxlength="20" />
                  <label for="rcNumber">Reference No.</label>
                  <div class="fhint">Optional. Old system or recipe card number.</div>
                </div>
                <div class="field-block span2">
                  <span class="mini-label">Veg / Non-Veg *</span>
                  <div class="food-type" id="rcFood">
                    <label data-f="veg"><input type="radio" name="rcFood" value="veg" /><span class="vmark"></span>Veg</label>
                    <label data-f="egg"><input type="radio" name="rcFood" value="egg" /><span class="vmark egg"></span>Egg</label>
                    <label data-f="nonveg"><input type="radio" name="rcFood" value="nonveg" /><span class="vmark nonveg"></span>Non-Veg</label>
                  </div>
                </div>
              </div>
            </section>

            <section class="sec card">
              <div class="sec-head"><span class="step">3</span><div><h3>Classification</h3><p>Groups the recipe for stock and food-cost reports (from Category Master).</p></div></div>
              <div class="grid g4">
                <div class="field fixed">
                  <select id="rcCategory"></select>
                  <label for="rcCategory">Inventory Category *</label>
                  <div class="fhint">Main group, e.g. Gravies &amp; Curry Bases.</div>
                </div>
                <div class="field fixed">
                  <select id="rcSubCategory"></select>
                  <label for="rcSubCategory">Sub-Category</label>
                  <div class="fhint">Optional. Narrower group inside the category.</div>
                </div>
              </div>
            </section>

            <section class="sec card">
              <div class="sec-head"><span class="step">4</span><div><h3>Batch size &amp; yield</h3><p>How much one batch makes and how much of it is usable after cooking.</p></div></div>
              <div class="grid g4">
                <div class="field fixed">
                  <input type="number" id="rcQty" min="0" step="any" placeholder="e.g. 5" />
                  <label for="rcQty">Batch Size *</label>
                  <div class="fhint">Quantity the ingredients below make.</div>
                </div>
                <div class="field fixed">
                  <select id="rcUom"></select>
                  <label for="rcUom">Stock Unit (UOM) *</label>
                  <div class="fhint">Unit it is stocked, issued and costed in.</div>
                </div>
                <div class="field fixed">
                  <div class="input-suffix"><input type="number" id="rcYield" min="1" max="100" step="any" placeholder="100" /><span>%</span></div>
                  <label for="rcYield">Recipe Yield % *</label>
                  <div class="fhint">Usable part after cooking loss. 100% = no loss.</div>
                </div>
                <div class="field fixed">
                  <input type="text" id="rcNet" disabled placeholder="—" />
                  <label for="rcNet">Usable Output</label>
                  <div class="fhint">Auto: Batch Size × Yield %.</div>
                </div>
                <div class="field fixed">
                  <div class="input-suffix"><input type="number" id="rcShelf" min="0" step="1" placeholder="e.g. 2" /><span>days</span></div>
                  <label for="rcShelf">Shelf Life</label>
                  <div class="fhint">How long it stays usable after it is made.</div>
                </div>
              </div>
              <p class="sec-note" id="rcUnitNote" style="display:none">Stock Unit is limited to its unit family because other recipes use this item as an ingredient.</p>
            </section>

            <section class="sec card fg-only">
              <div class="sec-head"><span class="step">5</span><div><h3>Selling on POS <span class="pos-tag">Finished Goods only</span></h3><p>Where guests find it on the menu, how it is sold and what it costs them.</p></div></div>
              <div class="grid g4">
                <div class="field fixed">
                  <select id="rcMenu"></select>
                  <label for="rcMenu">POS Menu Section *</label>
                  <div class="fhint">Menu group on the POS, e.g. Main Course.</div>
                </div>
                <div class="field fixed">
                  <select id="rcPosUom"></select>
                  <label for="rcPosUom">Selling Unit (POS UOM) *</label>
                  <div class="fhint">How it is sold: Plate, Cup, Pcs…</div>
                </div>
                <div class="field fixed">
                  <div class="input-suffix"><input type="number" id="rcConv" min="0" step="any" placeholder="e.g. 10" /><span id="rcConvUnit">Kg</span></div>
                  <label for="rcConv" id="rcConvLbl">Conversion *</label>
                  <div class="fhint" id="rcConvHint"></div>
                </div>
                <div class="field fixed">
                  <input type="text" id="rcConverted" disabled placeholder="—" />
                  <label for="rcConverted" id="rcConvertedLbl">Portions per Batch</label>
                  <div class="fhint">Auto: Usable Output × Conversion.</div>
                </div>
                <div class="field fixed">
                  <div class="input-prefix"><span>₹</span><input type="number" id="rcPrice" min="0" step="any" placeholder="0.00" /></div>
                  <label for="rcPrice" id="rcPriceLbl">Selling Price *</label>
                  <div class="fhint">Menu price on the POS, before tax (GST).</div>
                </div>
                <div class="field fixed span2">
                  <div class="img-pick">
                    <img id="rcImgPreview" alt="" style="display:none" />
                    <button type="button" class="btn-outline" id="rcImgBtn">Upload Image</button>
                    <button type="button" class="icon-btn del" id="rcImgRemove" title="Remove image" style="display:none"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
                    <input type="file" id="rcImg" accept="image/*" hidden />
                  </div>
                  <label>POS Display Image</label>
                  <div class="fhint">Optional. Shown on the POS menu button.</div>
                </div>
              </div>
            </section>

            <section class="sec card">
              <div class="sec-head"><span class="step">6</span><div><h3>Ingredients</h3><p>Raw materials and semi-finished items that go into one batch. Stock issued and cost are worked out for you.</p></div><span class="sec-aside" id="rcIngCount"></span></div>
              <div class="ing-wrap">
                <table class="ing-table">
                  <thead><tr>
                    <th class="c-item">Ingredient</th>
                    <th class="c-kind">Type</th>
                    <th class="c-qty">Qty in Recipe<small>goes into the dish</small></th>
                    <th class="c-unit">Unit</th>
                    <th class="c-w">Yield %<small>usable after trim</small></th>
                    <th>Stock Issued<small>qty ÷ yield</small></th>
                    <th>Wastage<small>trim / peel loss</small></th>
                    <th>Line Cost<small>at stock rate</small></th>
                    <th></th>
                  </tr></thead>
                  <tbody id="rcIngBody"></tbody>
                  <tfoot><tr><td colspan="7" class="tot-lbl">Total ingredient cost</td><td class="tot" id="rcIngTotal">—</td><td></td></tr></tfoot>
                </table>
              </div>
              <button type="button" class="btn-link" id="rcAddIng">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>Add Ingredient
              </button>
            </section>

            <section class="sec card">
              <div class="sec-head"><span class="step">7</span><div><h3>Description &amp; usage</h3><p>Extra information for staff, and which kitchens make or use this recipe.</p></div></div>
              <div class="grid g2">
                <div class="field fixed">
                  <textarea id="rcDesc" placeholder="e.g. Cottage cheese simmered in a rich tomato-butter gravy."></textarea>
                  <label for="rcDesc">Description</label>
                  <div class="fhint">Short description. For Finished Goods it can be shown on the POS / menu.</div>
                </div>
                <div class="field fixed">
                  <textarea id="rcRemarks" placeholder="e.g. Store below 5°C. Reheat to 75°C before use."></textarea>
                  <label for="rcRemarks">Kitchen Notes / Remarks</label>
                  <div class="fhint">Internal only: method, storage, reheating.</div>
                </div>
                <div class="field fixed">
                  <div class="multi" id="rcUsedBy">
                    <div class="multi-box" tabindex="0"></div>
                    <div class="multi-panel"></div>
                  </div>
                  <label>Used By (Kitchens) *</label>
                  <div class="fhint">Kitchens / departments that make or use this recipe.</div>
                </div>
              </div>
            </section>
          </div>

          <aside class="sum-card" id="rcSummary"></aside>
        </div>
      </div>
      <div class="rc-foot">
        <div class="missing" id="rcMissing"></div>
        <div class="btns">
          <button type="button" class="btn-outline" data-rc-close>Cancel</button>
          <button type="submit" class="btn-primary" id="rcSubmit" disabled>Save Recipe</button>
        </div>
      </div>
    </form>
  </div>
</div>

<div class="overlay" id="rcDeleteModal">
  <div class="modal">
    <div class="modal-head">
      <h2>Delete Recipe</h2>
      <button data-rc-close title="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="modal-body">
      <p class="confirm-text" id="rcDeleteText"></p>
    
    </div>
    <div class="modal-foot">
        <button type="button" class="btn-outline" data-rc-close>Cancel</button>
        <button type="button" class="btn-danger" id="rcConfirmDelete">Delete</button>
      </div>
  </div>
</div>
`;

  const host = document.createElement('div');
  host.className = 'page view';
  host.id = 'view-recipe';
  host.innerHTML = VIEW;
  document.querySelector('.content').appendChild(host);
  document.body.insertAdjacentHTML('beforeend', DIALOGS);
  const STORAGE_KEY = 'rms_recipes_v4';
  const RAW_KEY = 'rms_raw_items_v1';
  const CAT_KEY = 'rms_item_categories_v4';
  const MS_KEY = 'rms_menu_sections_v1';
  let pageSize = 10;
  const UI = window.RMSUI;
  const CUR = '₹';

  // Units with the same `dim` convert into each other; serving units only match themselves
  const UNITS = {
    kg: { dim: 'm', f: 1, label: 'Kg' }, g: { dim: 'm', f: 0.001, label: 'g' },
    ltr: { dim: 'v', f: 1, label: 'Ltr' }, ml: { dim: 'v', f: 0.001, label: 'ml' },
    pcs: { dim: 'pcs', f: 1, label: 'Pcs' },
    plate: { dim: 'plate', f: 1, label: 'Plate' }, half_plate: { dim: 'half_plate', f: 1, label: 'Half Plate' },
    portion: { dim: 'portion', f: 1, label: 'Portion' }, bowl: { dim: 'bowl', f: 1, label: 'Bowl' },
    cup: { dim: 'cup', f: 1, label: 'Cup' }, glass: { dim: 'glass', f: 1, label: 'Glass' },
    slice: { dim: 'slice', f: 1, label: 'Slice' }, scoop: { dim: 'scoop', f: 1, label: 'Scoop' }, bottle: { dim: 'bottle', f: 1, label: 'Bottle' },
  };
  const RECIPE_UOMS = ['kg', 'ltr', 'pcs', 'plate', 'half_plate', 'portion', 'bowl', 'cup', 'glass'];
  const POS_UOMS = ['plate', 'half_plate', 'portion', 'bowl', 'cup', 'glass', 'pcs', 'slice', 'scoop', 'bottle', 'kg', 'ltr'];
  const TYPE_LABEL = { SF: 'Semi-Finished', FG: 'Finished Goods' };
  const uLabel = u => (UNITS[u] || {}).label || u || '';
  const plural = l => ['Pcs', 'Kg', 'Ltr'].includes(l) ? l : /s$/.test(l) ? l + 'es' : l + 's';

  // Departments that use a recipe (normally from Setting › Department)
  const DEPARTMENTS = [
    ['central', 'Central Kitchen'], ['main', 'Main Kitchen (Indian)'], ['tandoor', 'Tandoor'], ['chinese', 'Chinese Kitchen'],
    ['continental', 'Continental Kitchen'], ['bakery', 'Bakery & Pastry'], ['beverage', 'Beverage Counter'],
  ];

  // Raw material master (normally from Inventory › Items) — [id, name, base unit, cost per base unit]
  const RAW_SEED = [
    ['paneer', 'Paneer', 'kg', 380], ['butter', 'Butter', 'kg', 520], ['cream', 'Fresh Cream', 'ltr', 220],
    ['milk', 'Milk', 'ltr', 60], ['curd', 'Curd', 'kg', 80], ['ghee', 'Ghee', 'kg', 600],
    ['mozzarella', 'Mozzarella Cheese', 'kg', 480], ['eggs', 'Eggs', 'pcs', 7],
    ['chicken_bl', 'Chicken Boneless', 'kg', 320], ['chicken_cc', 'Chicken Curry Cut', 'kg', 240], ['mutton', 'Mutton', 'kg', 750],
    ['onion', 'Onion', 'kg', 35], ['tomato', 'Tomato', 'kg', 40], ['ginger', 'Ginger', 'kg', 120], ['garlic', 'Garlic', 'kg', 160],
    ['green_chilli', 'Green Chilli', 'kg', 80], ['coriander', 'Coriander Leaves', 'kg', 100], ['lemon', 'Lemon', 'pcs', 5],
    ['rice', 'Basmati Rice', 'kg', 110], ['maida', 'Maida (Refined Flour)', 'kg', 40], ['atta', 'Atta (Wheat Flour)', 'kg', 38],
    ['cashew', 'Cashew Nuts', 'kg', 900], ['yeast', 'Dry Yeast', 'kg', 300],
    ['oil', 'Refined Oil', 'ltr', 150], ['salt', 'Salt', 'kg', 20], ['sugar', 'Sugar', 'kg', 45],
    ['chilli_pwd', 'Red Chilli Powder', 'kg', 350], ['turmeric', 'Turmeric Powder', 'kg', 250], ['garam', 'Garam Masala', 'kg', 700],
    ['jeera', 'Cumin Seeds (Jeera)', 'kg', 400], ['kasuri', 'Kasuri Methi', 'kg', 500],
    ['tea', 'Tea Leaves', 'kg', 450], ['coffee', 'Coffee Powder', 'kg', 900],
  ];

  // [key, type, name, categoryCode, foodType, [recipeQty, uom, yield%], extra, ingredients[[ref, requiredQty, uom, yield%]]]
  const RECIPE_SEED = [
    ['mkh', 'SF', 'Makhani Gravy', 'SF-GRV', 'veg', [5, 'kg', 90], { shelf: 2, alias: 'MKH GRAVY', usedBy: ['central', 'main'],
      desc: 'Smooth tomato, butter and cashew base for makhani dishes.', remarks: 'Store below 5°C. Reheat to 75°C before use.' }, [
      ['RM:tomato', 4, 'kg', 95], ['RM:butter', 400, 'g'], ['RM:cream', 500, 'ml'], ['RM:cashew', 200, 'g'],
      ['RM:ginger', 100, 'g', 90], ['RM:garlic', 100, 'g', 90], ['RM:kasuri', 20, 'g'], ['RM:chilli_pwd', 50, 'g'],
      ['RM:sugar', 100, 'g'], ['RM:salt', 80, 'g']]],
    ['ggp', 'SF', 'Ginger-Garlic Paste', 'SF-PST', 'veg', [2, 'kg', 100], { shelf: 7, alias: 'GG PASTE', usedBy: ['central'],
      desc: 'Fresh ginger and garlic ground with oil and salt.' }, [
      ['RM:ginger', 1, 'kg', 90], ['RM:garlic', 1, 'kg', 88], ['RM:oil', 100, 'ml'], ['RM:salt', 20, 'g']]],
    ['otm', 'SF', 'Onion-Tomato Masala', 'SF-GRV', 'veg', [5, 'kg', 85], { shelf: 2, usedBy: ['central', 'main'],
      desc: 'Slow-cooked onion and tomato base for curries.' }, [
      ['RM:onion', 3, 'kg', 90], ['RM:tomato', 2, 'kg', 95], ['RM:oil', 300, 'ml'], ['SF:ggp', 150, 'g'],
      ['RM:turmeric', 20, 'g'], ['RM:chilli_pwd', 40, 'g'], ['RM:garam', 30, 'g'], ['RM:salt', 60, 'g']]],
    ['tkc', 'SF', 'Tikka Marinated Chicken', 'SF-MAR-MPL', 'nonveg', [2.5, 'kg', 100], { shelf: 1, usedBy: ['central', 'tandoor'],
      desc: 'Boneless chicken in spiced yogurt marinade.', remarks: 'Marinate at least 4 hours. Keep chilled.' }, [
      ['RM:chicken_bl', 2, 'kg'], ['RM:curd', 400, 'g'], ['SF:ggp', 100, 'g'], ['RM:chilli_pwd', 30, 'g'],
      ['RM:garam', 20, 'g'], ['RM:lemon', 4, 'pcs'], ['RM:oil', 50, 'ml'], ['RM:salt', 40, 'g']]],
    ['pzd', 'SF', 'Pizza Dough Ball', 'SF-DGH', 'veg', [12, 'pcs', 100], { shelf: 2, alias: 'DOUGH BALL', usedBy: ['bakery', 'continental'],
      desc: 'Pizza base dough, about 175 g per ball.' }, [
      ['RM:maida', 2, 'kg'], ['RM:yeast', 30, 'g'], ['RM:sugar', 30, 'g'], ['RM:salt', 40, 'g'], ['RM:oil', 100, 'ml']]],
    ['pbm', 'FG', 'Paneer Butter Masala', 'FG-IND-IVG', 'veg', [1, 'plate', 100], { menu: 'Main Course', price: 320, alias: 'PBM', pos: ['plate', 1],
      usedBy: ['main'], desc: 'Cottage cheese simmered in a rich tomato-butter gravy.' }, [
      ['RM:paneer', 150, 'g'], ['SF:mkh', 200, 'g'], ['RM:butter', 15, 'g'], ['RM:cream', 20, 'ml'], ['RM:coriander', 5, 'g', 80]]],
    ['ctk', 'FG', 'Chicken Tikka', 'FG-TDR-TNV', 'nonveg', [1, 'plate', 100], { menu: 'Starters', price: 360, alias: 'CHK TIKKA', pos: ['plate', 1],
      usedBy: ['tandoor'], desc: 'Six pieces of char-grilled marinated chicken.' }, [
      ['SF:tkc', 250, 'g'], ['RM:butter', 10, 'g'], ['RM:lemon', 1, 'pcs'], ['RM:onion', 50, 'g', 90]]],
    ['bnn', 'FG', 'Butter Naan', 'FG-TDR-TBR', 'veg', [1, 'pcs', 100], { menu: 'Breads', price: 60, alias: 'B NAAN', pos: ['pcs', 1],
      usedBy: ['tandoor'], desc: 'Leavened flatbread from the tandoor, brushed with butter.' }, [
      ['RM:maida', 90, 'g'], ['RM:curd', 10, 'g'], ['RM:butter', 10, 'g'], ['RM:salt', 2, 'g']]],
    ['jrc', 'FG', 'Jeera Rice', 'FG-IND-IVG', 'veg', [3, 'kg', 100], { menu: 'Rice & Biryani', price: 180, alias: 'JEERA RICE', pos: ['plate', 4],
      usedBy: ['main'], desc: 'Basmati rice tempered with cumin and ghee.', remarks: 'Cooked in 3 kg batches. Hold hot for max 2 hours.' }, [
      ['RM:rice', 1.2, 'kg'], ['RM:ghee', 100, 'g'], ['RM:jeera', 30, 'g'], ['RM:salt', 20, 'g']]],
    ['mgp', 'FG', 'Margherita Pizza', 'FG-CON-PZP', 'veg', [1, 'pcs', 100], { menu: 'Pizza & Pasta', price: 399, alias: 'MARGHERITA', pos: ['pcs', 1],
      usedBy: ['continental'], desc: 'Classic pizza with tomato, mozzarella and basil.' }, [
      ['SF:pzd', 1, 'pcs'], ['RM:mozzarella', 120, 'g'], ['RM:tomato', 60, 'g', 95], ['RM:oil', 10, 'ml']]],
    ['mch', 'FG', 'Masala Chai', 'FG-BEV-HBV', 'veg', [1.5, 'ltr', 90], { menu: 'Hot Beverages', price: 40, alias: 'CHAI', pos: ['cup', 8],
      usedBy: ['beverage'], desc: 'Milk tea brewed with ginger and spices.' }, [
      ['RM:milk', 1.2, 'ltr'], ['RM:tea', 50, 'g'], ['RM:sugar', 100, 'g'], ['RM:ginger', 30, 'g', 90]]],
  ];

  const $ = id => document.getElementById(id);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const toast = (m, e) => window.rmsToast && window.rmsToast(m, e);
  const money = n => CUR + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtQty = n => (Math.round(n * 1000) / 1000).toString();
  const read = key => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } };
  const write = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { toast('Could not save — image may be too large', true); return false; } return true; };

  // ---------- Data ----------
  let raws = read(RAW_KEY);
  if (!raws.length) { raws = RAW_SEED.map(([id, name, unit, cost]) => ({ id, name, unit, cost })); write(RAW_KEY, raws); }

  function seedRecipes() {
    const cats = read(CAT_KEY), secs = read(MS_KEY);
    // a seed code may point at a sub-category: split it into category + sub-category
    const catOf = code => { const c = cats.find(x => x.code === code); return !c ? ['', ''] : c.parentId ? [c.parentId, c.id] : [c.id, '']; };
    const secId = name => (secs.find(s => s.name === name) || {}).id || '';
    const idOf = {};
    RECIPE_SEED.forEach(([key]) => { idOf[key] = uid(); });
    const counters = { SF: 0, FG: 0 };
    return RECIPE_SEED.map(([key, type, name, cat, food, [q, u, y], x, ing]) => {
      const [categoryId, subCategoryId] = catOf(cat);
      return {
        id: idOf[key], code: `${type}-R${String(++counters[type]).padStart(3, '0')}`, type, name,
        categoryId, subCategoryId, foodType: food, alias: x.alias || '', sku: '', number: '',
        outputQty: q, outputUnit: u, yield: y, shelfLife: x.shelf ?? '',
        posUnit: x.pos ? x.pos[0] : '', conversion: x.pos ? x.pos[1] : '',
        menuSectionId: x.menu ? secId(x.menu) : '', price: x.price || 0, image: '',
        description: x.desc || '', remarks: x.remarks || '', usedBy: x.usedBy || [], createdAt: Date.now(),
        ingredients: ing.map(([ref, qty, unit, iy]) => ({ ref: ref.startsWith('SF:') ? 'SF:' + idOf[ref.slice(3)] : ref, qty, unit, yield: iy || 100 })),
      };
    });
  }
  let recipes = read(STORAGE_KEY);
  if (localStorage.getItem(STORAGE_KEY) === null) { recipes = seedRecipes(); write(STORAGE_KEY, recipes); }
  const byId = id => recipes.find(r => r.id === id);

  // ---------- Costing ----------
  const netOutput = r => (+r.outputQty || 0) * Math.min(Math.max(+r.yield || 0, 0), 100) / 100;
  // POS side (Finished Goods): 1 stock UOM = `conversion` POS units, e.g. 1 Kg = 10 Plate
  const posUnitOf = r => (r.type === 'FG' && r.posUnit) || r.outputUnit;
  const convOf = r => r.type !== 'FG' || posUnitOf(r) === r.outputUnit ? 1 : +r.conversion || 0;
  // Issued from stock for one line, in the line's own UOM: Required Qty ÷ Yield %
  function usedQty(line) {
    const y = line.yield === '' || line.yield == null ? 100 : Math.min(+line.yield, 100);
    return y > 0 ? (+line.qty || 0) * 100 / y : 0;
  }
  function source(ref, visiting = new Set()) {
    const [kind, id] = ref.split(':');
    if (kind === 'RM') {
      const r = raws.find(x => x.id === id);
      return r ? { name: r.name, unit: r.unit, costPer: r.cost, kind: 'RM' } : null;
    }
    const rc = byId(id);
    if (!rc || visiting.has(id)) return null;
    const net = netOutput(rc);
    const cost = recipeCost(rc.ingredients, new Set([...visiting, id]));
    return { name: rc.name, unit: rc.outputUnit, costPer: net > 0 ? cost / net : 0, kind: 'SF' };
  }
  const compatible = (unit, src) => src && UNITS[unit] && UNITS[src.unit] && UNITS[unit].dim === UNITS[src.unit].dim;
  function lineCost(line, visiting) {
    const src = source(line.ref, visiting);
    return compatible(line.unit, src) ? usedQty(line) * UNITS[line.unit].f * src.costPer : 0;
  }
  const recipeCost = (ings, visiting = new Set()) => ings.reduce((t, l) => t + (l.ref ? lineCost(l, visiting) : 0), 0);
  const unitCost = r => { const n = netOutput(r); return n > 0 ? recipeCost(r.ingredients) / n : 0; };
  const fcClass = p => p <= 35 ? 'good' : p <= 45 ? 'warn' : 'bad';

  // does recipe `rid` use `targetId` anywhere down its ingredient tree?
  function uses(rid, targetId, seen = new Set()) {
    if (rid === targetId) return true;
    if (seen.has(rid)) return false;
    seen.add(rid);
    const r = byId(rid);
    return !!r && r.ingredients.some(l => l.ref.startsWith('SF:') && uses(l.ref.slice(3), targetId, seen));
  }
  const usedIn = id => recipes.filter(r => r.ingredients.some(l => l.ref === 'SF:' + id));

  // ---------- Lookups ----------
  function catLabel(r) {
    const cats = read(CAT_KEY);
    const c = cats.find(x => x.id === r.categoryId), s = cats.find(x => x.id === r.subCategoryId);
    return c ? (s ? `${c.name} › ${s.name}` : c.name) : '';
  }
  const secLabel = id => (read(MS_KEY).find(s => s.id === id) || {}).name || '';

  // ---------- List ----------
  let filter = 'ALL', page = 1;
  function filtered() {
    const q = $('rcSearch').value.trim().toLowerCase();
    return recipes
      .filter(r => filter === 'ALL' || r.type === filter)
      .filter(r => !q || [r.name, r.alias, r.sku, r.number, r.code, catLabel(r), secLabel(r.menuSectionId)].some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => b.type.localeCompare(a.type) || a.name.localeCompare(b.name));
  }
  function renderTabs() {
    const n = t => recipes.filter(r => t === 'ALL' || r.type === t).length;
    $('rcTabs').innerHTML = [['ALL', 'All'], ['SF', 'Semi-Finished'], ['FG', 'Finished Goods']]
      .map(([k, l]) => `<button class="${k === filter ? 'active' : ''}" data-f="${k}">${l}<span class="n">${n(k)}</span></button>`).join('');
  }
  function render() {
    renderTabs();
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    if (page > pages) page = pages;
    const start = (page - 1) * pageSize;
    const rows = list.slice(start, start + pageSize);
    $('rcBody').innerHTML = rows.length ? rows.map(r => {
      const isFG = r.type === 'FG';
      const u = uLabel(r.outputUnit), pu = uLabel(posUnitOf(r)), conv = convOf(r);
      const uc = unitCost(r), pc = conv > 0 ? uc / conv : 0;
      const cat = catLabel(r), sec = secLabel(r.menuSectionId);
      const fc = isFG && r.price > 0 ? pc / r.price * 100 : null;
      const sub = [r.code, r.alias, r.sku, r.number && 'No. ' + r.number].filter(Boolean).map(esc).join(' · ');
      const outNotes = [];
      if (+r.yield < 100) outNotes.push(`${fmtQty(r.yield)}% yield → ${fmtQty(netOutput(r))} ${u}`);
      if (isFG && pu !== u && conv > 0) outNotes.push(`= ${fmtQty(netOutput(r) * conv)} ${pu} (1 ${u} = ${fmtQty(conv)} ${pu})`);
      return `<tr>
        <td class="pin-l"><span class="actions">
          <button class="icon-btn" data-edit="${r.id}" title="Edit" aria-label="Edit ${esc(r.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="icon-btn del" data-delete="${r.id}" title="Delete" aria-label="Delete ${esc(r.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>
        </span></td>
        <td class="pin-n strong"><span style="display:flex;align-items:center"><span class="vmark ${r.foodType === 'veg' ? '' : r.foodType}"></span>${esc(r.name)}</span><span class="rc-code">${sub}</span></td>
        <td><span class="chip ${isFG ? 'finished' : 'semi'}">${TYPE_LABEL[r.type]}</span></td>
        <td>${cat ? esc(cat) : '<span class="muted">—</span>'}</td>
        <td>${isFG ? (sec ? esc(sec) : '<span style="color:#b45309">Not mapped</span>') : '<span class="muted">—</span>'}</td>
        <td>${fmtQty(r.outputQty)} ${u}${outNotes.map(n => `<span class="rc-code">${n}</span>`).join('')}</td>
        <td class="num">${money(isFG ? pc : uc)}<span class="rc-code">per ${isFG ? pu : u}</span></td>
        <td class="num">${isFG ? `${money(r.price)}<span class="rc-code">per ${pu}</span>` : '<span class="muted">—</span>'}</td>
        <td class="num">${fc === null ? '<span class="muted">—</span>' : `<span class="fc ${fcClass(fc)}">${fc.toFixed(1)}%</span>`}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="9" class="empty">No recipes found</td></tr>`;

    UI.pager($('rcPagination'), $('rcInfo'), list.length, page, p => { page = p; render(); }, pageSize);
    UI.bindPin($('rcWrap'));
  }
  $('rcTabs').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; page = 1; render(); } });
  $('rcSearch').addEventListener('input', () => { page = 1; render(); });
  UI.mountSize('rcSize', pageSize, n => { pageSize = n; page = 1; render(); });
  $('rcRefresh').innerHTML = UI.ICREFRESH;
  $('rcRefresh').addEventListener('click', () => { render(); toast('Recipe list refreshed'); });
  $('rcExport').insertAdjacentHTML('afterbegin', UI.ICDOWN);
  $('rcExport').addEventListener('click', () => {
    const n = UI.csv('recipe',
      ['Recipe Name', 'Type', 'Category', 'Menu Section', 'Output', 'Cost', 'Price', 'Food Cost %'],
      filtered().map(r => {
        const isFG = r.type === 'FG', u = uLabel(r.outputUnit), pu = uLabel(posUnitOf(r)), conv = convOf(r);
        const uc = unitCost(r), pc = conv > 0 ? uc / conv : 0;
        const fc = isFG && r.price > 0 ? pc / r.price * 100 : null;
        return [r.name, TYPE_LABEL[r.type], catLabel(r), isFG ? secLabel(r.menuSectionId) : '', `${fmtQty(r.outputQty)} ${u}`,
          (isFG ? pc : uc).toFixed(2), isFG ? Number(r.price || 0).toFixed(2) : '', fc === null ? '' : fc.toFixed(1)];
      }));
    toast(n < 0 ? 'Export not available here' : `Exported ${n} rows`, n < 0);
  });
  $('rcBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-delete]');
    if (ed) openForm(ed.dataset.edit);
    if (del) openDelete(del.dataset.delete);
  });

  // ---------- Form ----------
  let draft = null, editingId = null;
  const DEFAULTS = { SF: { outputQty: '', outputUnit: 'kg' }, FG: { outputQty: 1, outputUnit: 'plate' } };

  function setType(t) {
    // a new recipe whose units were not touched gets the usual default for the type
    if (!editingId && !draft.unitsTouched) {
      Object.assign(draft, DEFAULTS[t]);
      $('rcQty').value = draft.outputQty;
    }
    draft.type = t;
    if (t === 'FG' && !draft.posUnit) { draft.posUnit = draft.outputUnit; draft.conversion = 1; }
    document.querySelectorAll('#rcType label').forEach(l => {
      l.classList.toggle('on', l.dataset.t === t);
      l.querySelector('input').checked = l.dataset.t === t;
    });
    // selling on POS — Finished Goods only
    document.querySelectorAll('#rcModal .fg-only').forEach(el => { el.style.display = t === 'FG' ? '' : 'none'; });
    fillCategories();
    fillUoms();
    syncConversion();
    draft.ingredients.forEach(l => { if (l.ref && !allowedRef(l.ref)) l.ref = ''; });
    renumberSections();
    renderIngredients();
  }
  // step numbers skip the hidden "Selling on POS" card for Semi-Finished
  function renumberSections() {
    let n = 0;
    document.querySelectorAll('#rcModal .sec').forEach(sec => {
      const step = sec.querySelector('.step');
      if (step && sec.style.display !== 'none') step.textContent = ++n;
    });
  }

  // Category → Sub Category (from Category Master, same inventory type)
  const typeCats = () => read(CAT_KEY).filter(c => c.type === draft.type);
  function fillCategories() {
    const mains = typeCats().filter(c => !c.parentId && (c.active || c.id === draft.categoryId)).sort((a, b) => a.name.localeCompare(b.name));
    $('rcCategory').innerHTML = '<option value="">Select category</option>' + mains.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
    $('rcCategory').value = mains.some(c => c.id === draft.categoryId) ? draft.categoryId : '';
    draft.categoryId = $('rcCategory').value;
    fillSubCategories();
  }
  function fillSubCategories() {
    const subs = draft.categoryId
      ? typeCats().filter(c => c.parentId === draft.categoryId && (c.active || c.id === draft.subCategoryId)).sort((a, b) => a.name.localeCompare(b.name))
      : [];
    $('rcSubCategory').innerHTML = `<option value="">${!draft.categoryId ? 'Select category first' : subs.length ? 'None' : 'No sub-categories'}</option>` +
      subs.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    $('rcSubCategory').disabled = !subs.length;
    $('rcSubCategory').value = subs.some(s => s.id === draft.subCategoryId) ? draft.subCategoryId : '';
    draft.subCategoryId = $('rcSubCategory').value;
  }

  // UOM is locked to its unit family once other recipes use this item, so their costing stays valid
  function lockedDim() {
    const r = editingId && byId(editingId);
    return r && usedIn(r.id).length ? UNITS[r.outputUnit].dim : null;
  }
  function fillUoms() {
    const dim = lockedDim();
    const list = RECIPE_UOMS.filter(u => !dim || UNITS[u].dim === dim);
    $('rcUom').innerHTML = list.map(u => `<option value="${u}">${uLabel(u)}</option>`).join('');
    if (!list.includes(draft.outputUnit)) draft.outputUnit = list[0];
    $('rcUom').value = draft.outputUnit;
    $('rcUnitNote').style.display = dim ? '' : 'none';
    $('rcPosUom').innerHTML = POS_UOMS.map(u => `<option value="${u}">${uLabel(u)}</option>`).join('');
    $('rcPosUom').value = draft.posUnit || draft.outputUnit;
  }
  // Same POS UOM and UOM → conversion is 1 and locked; when they split, ask for the real value
  function syncConversion() {
    const same = !draft.posUnit || draft.posUnit === draft.outputUnit;
    if (same) { draft.conversion = 1; draft.convAuto = true; }
    else if (draft.convAuto) { draft.conversion = ''; draft.convAuto = false; }
    const u = uLabel(draft.outputUnit), pu = uLabel(draft.posUnit || draft.outputUnit);
    $('rcConv').disabled = same;
    $('rcConv').value = draft.conversion;
    $('rcConvUnit').textContent = pu;
    $('rcConvLbl').textContent = `Conversion (1 ${u} = ? ${pu}) *`;
    $('rcConvHint').textContent = same
      ? 'Selling unit is the same as the stock unit, so this is 1.'
      : `How many ${plural(pu)} you get from 1 ${u} (e.g. 1 Kg = 10 Plates).`;
  }
  function fillMenuSections() {
    const secs = read(MS_KEY).filter(s => s.active || s.id === draft.menuSectionId);
    $('rcMenu').innerHTML = '<option value="">Select menu section</option>' +
      secs.map(s => `<option value="${s.id}">${esc(s.name)}${s.active ? '' : ' (inactive)'}</option>`).join('');
    $('rcMenu').value = secs.some(s => s.id === draft.menuSectionId) ? draft.menuSectionId : '';
  }

  // ---------- Used By (multi-select) ----------
  function renderUsedBy() {
    const chosen = DEPARTMENTS.filter(([id]) => draft.usedBy.includes(id));
    const all = chosen.length === DEPARTMENTS.length;
    $('rcUsedBy').querySelector('.multi-box').innerHTML =
      (chosen.length ? chosen.map(([, n]) => `<span class="multi-chip">${esc(n)}</span>`).join('') : '<span class="ph">Select kitchens / departments</span>') + '<span class="caret"></span>';
    $('rcUsedBy').querySelector('.multi-panel').innerHTML =
      `<div class="multi-opt" data-id="*"><span class="cb ${all ? 'on' : ''}"></span><b>Select all</b></div>` +
      DEPARTMENTS.map(([id, n]) => `<div class="multi-opt" data-id="${id}"><span class="cb ${draft.usedBy.includes(id) ? 'on' : ''}"></span>${esc(n)}</div>`).join('');
  }
  function toggleUsedBy(open) {
    const el = $('rcUsedBy');
    open = open ?? !el.classList.contains('open');
    if (open) {
      // open upwards when there is not enough room below inside the form
      const box = el.getBoundingClientRect(), body = $('rcModal').querySelector('.rc-body').getBoundingClientRect();
      el.classList.toggle('up', body.bottom - box.bottom < 270 && box.top - body.top > 270);
    }
    el.classList.toggle('open', open);
  }
  $('rcUsedBy').querySelector('.multi-box').addEventListener('click', () => toggleUsedBy());
  $('rcUsedBy').querySelector('.multi-box').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleUsedBy(); }
  });
  $('rcUsedBy').querySelector('.multi-panel').addEventListener('click', e => {
    const o = e.target.closest('.multi-opt');
    if (!o) return;
    const id = o.dataset.id;
    if (id === '*') draft.usedBy = draft.usedBy.length === DEPARTMENTS.length ? [] : DEPARTMENTS.map(([d]) => d);
    else draft.usedBy = draft.usedBy.includes(id) ? draft.usedBy.filter(x => x !== id) : [...draft.usedBy, id];
    renderUsedBy();
    refresh();
  });
  document.addEventListener('mousedown', e => { if (!e.target.closest('#rcUsedBy')) toggleUsedBy(false); });

  // ---------- Ingredients ----------
  function allowedRef(ref) {
    if (ref.startsWith('RM:')) return true;
    const id = ref.slice(3);
    return !!byId(id) && byId(id).type === 'SF' && !(editingId && uses(id, editingId));
  }
  function ingredientOptions(selected) {
    const rm = [...raws].sort((a, b) => a.name.localeCompare(b.name));
    const sf = recipes.filter(r => r.type === 'SF' && allowedRef('SF:' + r.id)).sort((a, b) => a.name.localeCompare(b.name));
    const opt = (v, l) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`;
    return '<option value="">Select ingredient</option>' +
      `<optgroup label="Raw Material">${rm.map(r => opt('RM:' + r.id, r.name)).join('')}</optgroup>` +
      (sf.length ? `<optgroup label="Semi-Finished (from recipes)">${sf.map(r => opt('SF:' + r.id, r.name)).join('')}</optgroup>` : '');
  }
  function unitOptions(ref, selected) {
    const src = ref && source(ref);
    if (!src) return '<option value="">—</option>';
    return Object.entries(UNITS).filter(([, u]) => u.dim === UNITS[src.unit].dim)
      .map(([k, u]) => `<option value="${k}" ${k === selected ? 'selected' : ''}>${u.label}</option>`).join('');
  }
  function renderIngredients() {
    const body = $('rcIngBody');
    if (!draft.ingredients.length) {
      body.innerHTML = `<tr><td colspan="9" class="ing-empty">No ingredients yet — click “Add Ingredient”.</td></tr>`;
    } else {
      body.innerHTML = draft.ingredients.map((l, i) => `<tr data-i="${i}">
        <td><select data-k="ref">${ingredientOptions(l.ref)}</select></td>
        <td class="calc" data-c="kind"></td>
        <td><input type="number" data-k="qty" min="0" step="any" value="${l.qty === '' ? '' : l.qty}" placeholder="0" /></td>
        <td><select data-k="unit">${unitOptions(l.ref, l.unit)}</select></td>
        <td><input type="number" data-k="yield" min="1" max="100" step="any" value="${l.yield === '' ? '' : l.yield}" placeholder="100" /></td>
        <td class="calc" data-c="used"></td>
        <td class="calc" data-c="waste"></td>
        <td class="calc" data-c="cost"></td>
        <td><button type="button" class="icon-btn del" data-rm="${i}" title="Remove"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></td>
      </tr>`).join('');
    }
    draft.ingredients.forEach((_, i) => updateLine(i));
    refresh();
  }
  function updateLine(i) {
    const tr = $('rcIngBody').querySelector(`tr[data-i="${i}"]`);
    if (!tr) return;
    const l = draft.ingredients[i];
    const src = l.ref && source(l.ref);
    const set = (c, h) => { tr.querySelector(`[data-c="${c}"]`).innerHTML = h; };
    const dash = '<span class="muted">—</span>';
    set('kind', src ? `<span class="kind ${src.kind.toLowerCase()}">${src.kind === 'RM' ? 'Raw Material' : 'Semi-Finished'}</span>` : dash);
    if (!src || !(+l.qty > 0)) {
      set('used', dash); set('waste', dash);
      set('cost', src ? `${dash}<span class="src">${money(src.costPer)} / ${uLabel(src.unit)}</span>` : dash);
      return;
    }
    const used = usedQty(l), waste = used - (+l.qty);
    set('used', `${fmtQty(used)} ${uLabel(l.unit)}`);
    set('waste', waste > 0.0005 ? `${fmtQty(waste)} ${uLabel(l.unit)}` : dash);
    set('cost', `${money(lineCost(l))}<span class="src">${money(src.costPer)} / ${uLabel(src.unit)}</span>`);
  }

  $('rcIngBody').addEventListener('input', e => {
    const tr = e.target.closest('tr[data-i]');
    const k = e.target.dataset.k;
    if (!tr || (k !== 'qty' && k !== 'yield')) return;
    const i = +tr.dataset.i;
    draft.ingredients[i][k] = e.target.value === '' ? '' : +e.target.value;
    updateLine(i);
    refresh();
  });
  $('rcIngBody').addEventListener('change', e => {
    const tr = e.target.closest('tr[data-i]');
    const k = e.target.dataset.k;
    if (!tr || (k !== 'ref' && k !== 'unit')) return;
    const i = +tr.dataset.i, l = draft.ingredients[i];
    if (k === 'ref') {
      if (e.target.value && draft.ingredients.some((x, j) => j !== i && x.ref === e.target.value)) {
        toast('This ingredient is already in the list', true);
        e.target.value = l.ref;
        return;
      }
      l.ref = e.target.value;
      const src = l.ref && source(l.ref);
      // bulk batches (Kg / Ltr) default to the stock unit, smaller recipes to g / ml
      const bulk = ['kg', 'ltr'].includes(draft.outputUnit);
      l.unit = !src ? '' : bulk ? src.unit : ({ kg: 'g', ltr: 'ml' }[src.unit] || src.unit);
      tr.querySelector('[data-k="unit"]').innerHTML = unitOptions(l.ref, l.unit);
      if (l.ref) tr.querySelector('[data-k="qty"]').focus();
    } else l.unit = e.target.value;
    updateLine(i);
    refresh();
  });
  $('rcIngBody').addEventListener('click', e => {
    const b = e.target.closest('[data-rm]');
    if (!b) return;
    draft.ingredients.splice(+b.dataset.rm, 1);
    renderIngredients();
  });
  $('rcAddIng').addEventListener('click', () => {
    draft.ingredients.push({ ref: '', qty: '', unit: '', yield: 100 });
    renderIngredients();
    const sels = $('rcIngBody').querySelectorAll('select[data-k="ref"]');
    sels[sels.length - 1]?.focus();
  });

  // ---------- Field bindings ----------
  $('rcType').addEventListener('change', e => {
    if (e.target.name !== 'rcType') return;
    if (editingId && draft.type === 'SF' && usedIn(editingId).length) {
      toast('This item is used in other recipes, so it must stay Semi-Finished', true);
      setType('SF');
      return;
    }
    // categories belong to one inventory type, so they reset when the type changes
    if (e.target.value !== draft.type) { draft.categoryId = ''; draft.subCategoryId = ''; }
    setType(e.target.value);
  });
  $('rcFood').addEventListener('change', e => {
    draft.foodType = e.target.value;
    document.querySelectorAll('#rcFood label').forEach(l => l.classList.toggle('on', l.dataset.f === draft.foodType));
  });
  const bind = (id, key, num, touch) => $(id).addEventListener('input', () => {
    draft[key] = num ? ($(id).value === '' ? '' : +$(id).value) : $(id).value;
    if (touch) draft.unitsTouched = true;
    refresh();
  });
  bind('rcName', 'name'); bind('rcAlias', 'alias'); bind('rcSku', 'sku'); bind('rcNumber', 'number');
  bind('rcDesc', 'description'); bind('rcRemarks', 'remarks');
  bind('rcQty', 'outputQty', true, true); bind('rcYield', 'yield', true); bind('rcShelf', 'shelfLife', true);
  bind('rcConv', 'conversion', true); bind('rcPrice', 'price', true);
  $('rcCategory').addEventListener('change', () => { draft.categoryId = $('rcCategory').value; draft.subCategoryId = ''; fillSubCategories(); refresh(); });
  $('rcSubCategory').addEventListener('change', () => { draft.subCategoryId = $('rcSubCategory').value; refresh(); });
  $('rcMenu').addEventListener('change', () => { draft.menuSectionId = $('rcMenu').value; refresh(); });
  $('rcUom').addEventListener('change', () => { draft.outputUnit = $('rcUom').value; draft.unitsTouched = true; syncConversion(); refresh(); });
  $('rcPosUom').addEventListener('change', () => { draft.posUnit = $('rcPosUom').value; syncConversion(); refresh(); });

  // image: resized to a small thumbnail so it fits in local storage
  $('rcImgBtn').addEventListener('click', () => $('rcImg').click());
  $('rcImg').addEventListener('change', () => {
    const f = $('rcImg').files[0];
    $('rcImg').value = '';
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 240 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      draft.image = c.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(img.src);
      showImage();
    };
    img.onerror = () => toast('Could not read that image', true);
    img.src = URL.createObjectURL(f);
  });
  $('rcImgRemove').addEventListener('click', () => { draft.image = ''; showImage(); });
  function showImage() {
    $('rcImgPreview').style.display = draft.image ? '' : 'none';
    $('rcImgRemove').style.display = draft.image ? '' : 'none';
    if (draft.image) $('rcImgPreview').src = draft.image;
    $('rcImgBtn').textContent = draft.image ? 'Change' : 'Upload Image';
  }

  // ---------- Summary + validation ----------
  const badYield = y => y !== '' && y != null && !(+y > 0 && +y <= 100);
  function missingFields() {
    const m = [];
    const isFG = draft.type === 'FG';
    if (!(draft.name || '').trim()) m.push(['Recipe Name', 'rcName']);
    if (!draft.categoryId) m.push(['Inventory Category', 'rcCategory']);
    if (!(+draft.outputQty > 0)) m.push(['Batch Size', 'rcQty']);
    if (draft.yield === '' || badYield(draft.yield)) m.push(['Recipe Yield % (1–100)', 'rcYield']);
    if (isFG && !draft.menuSectionId) m.push(['POS Menu Section', 'rcMenu']);
    if (isFG && !(convOf(draft) > 0)) m.push(['Conversion', 'rcConv']);
    if (isFG && !(+draft.price > 0)) m.push(['Selling Price', 'rcPrice']);
    if (!draft.ingredients.some(l => l.ref && +l.qty > 0 && l.unit)) {
      const blank = draft.ingredients.findIndex(l => !l.ref);
      m.push(['At least one ingredient', blank >= 0 ? `ing:${blank}:ref` : 'rcAddIng']);
    }
    const noQty = draft.ingredients.findIndex(l => l.ref && !(+l.qty > 0));
    if (noQty >= 0) m.push(['Qty in Recipe for every ingredient', `ing:${noQty}:qty`]);
    const badY = draft.ingredients.findIndex(l => l.ref && badYield(l.yield));
    if (badY >= 0) m.push(['Ingredient Yield % (1–100)', `ing:${badY}:yield`]);
    if (!draft.usedBy.length) m.push(['Used By (Kitchens)', 'rcUsedBy']);
    return m;
  }
  function goTo(target) {
    let el;
    if (target.startsWith('ing:')) {
      const [, i, k] = target.split(':');
      el = $('rcIngBody').querySelector(`tr[data-i="${i}"] [data-k="${k}"]`);
    } else el = target === 'rcUsedBy' ? $('rcUsedBy').querySelector('.multi-box') : $(target);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.focus({ preventScroll: true });
  }
  $('rcMissing').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) goTo(b.dataset.go); });
  function refresh() {
    const isFG = draft.type === 'FG';
    const name = (draft.name || '').trim().toLowerCase();
    const dup = name && recipes.some(r => r.id !== editingId && r.type === draft.type && r.name.toLowerCase() === name);
    $('rcNameErr').textContent = dup ? `Already exists in ${TYPE_LABEL[draft.type]}.` : '';
    $('rcNameField').classList.toggle('error', !!dup);
    const sku = (draft.sku || '').trim().toUpperCase();
    const skuDup = sku && recipes.some(r => r.id !== editingId && (r.sku || '').toUpperCase() === sku);
    $('rcSkuErr').textContent = skuDup ? 'This SKU is already used.' : '';
    $('rcSkuField').classList.toggle('error', !!skuDup);

    const miss = missingFields();
    $('rcMissing').innerHTML = miss.length
      ? `<span class="need-lbl">Still needed (${miss.length}):</span>` + miss.map(([l, t]) => `<button type="button" class="need" data-go="${t}">${esc(l)}</button>`).join('')
      : '<span class="ready">✓ All required fields are filled</span>';
    $('rcSubmit').disabled = !!miss.length || !!dup || !!skuDup;

    const u = uLabel(draft.outputUnit), pu = uLabel(posUnitOf(draft)), conv = convOf(draft);
    const net = netOutput(draft);
    const lines = draft.ingredients.filter(l => l.ref);
    const cost = recipeCost(lines);
    const uc = net > 0 ? cost / net : 0, pc = conv > 0 ? uc / conv : 0;
    const price = +draft.price || 0;
    const fc = isFG && price && net > 0 && conv > 0 ? pc / price * 100 : null;

    // calculated fields
    $('rcNet').value = net > 0 ? `${fmtQty(net)} ${u}` : '';
    $('rcConvertedLbl').textContent = `${plural(pu)} per Batch`;
    $('rcConverted').value = net > 0 && conv > 0 ? `${fmtQty(net * conv)} ${pu}` : '';
    $('rcPriceLbl').textContent = `Selling Price per ${pu} *`;
    $('rcIngTotal').textContent = lines.length ? money(cost) : '—';
    $('rcIngCount').textContent = lines.length ? `${lines.length} ingredient${lines.length > 1 ? 's' : ''}` : '';

    // live costing panel: headline figures first, breakdown below
    const tile = (l, v, cls = '') => `<div class="kpi ${cls}"><span>${l}</span><b>${v}</b></div>`;
    const row = (l, v) => `<div class="sum-row"><span>${l}</span><b>${v}</b></div>`;
    const has = lines.length && net > 0;
    let html = '<div class="sum-head"><h3>Live Costing</h3><span>updates as you type</span></div>';
    if (isFG) {
      html += '<div class="kpis">' +
        tile(`Cost per ${pu}`, has && conv > 0 ? money(pc) : '—') +
        tile('Food cost', fc === null ? '—' : `<span class="fc ${fcClass(fc)}">${fc.toFixed(1)}%</span>`) +
        tile(`Price per ${pu}`, price ? money(price) : '—') +
        tile(`Profit per ${pu}`, fc !== null ? money(price - pc) : '—', fc !== null && price < pc ? 'neg' : '') +
        '</div><div class="fc-legend"><span><i class="good"></i>≤35% healthy</span><span><i class="warn"></i>35–45% watch</span><span><i class="bad"></i>&gt;45% high</span></div>' +
        `<p class="fc-explain">Food cost % = cost per ${pu} ÷ selling price × 100. It is the share of the selling price spent on ingredients.</p>`;
    } else {
      html += '<div class="kpis">' +
        tile(`Cost per ${u}`, has ? money(uc) : '—') +
        tile('Usable output', net > 0 ? `${fmtQty(net)} ${u}` : '—') + '</div>';
    }
    html += '<div class="sum-group">Breakdown</div>' +
      row('Ingredients used', lines.length) +
      row('Total ingredient cost', money(cost)) +
      row('Batch size', +draft.outputQty > 0 ? `${fmtQty(draft.outputQty)} ${u}` : '—') +
      row('Recipe yield', draft.yield === '' ? '—' : `${fmtQty(draft.yield)}%`);
    if (isFG) {
      html += row('Usable output', net > 0 ? `${fmtQty(net)} ${u}` : '—') +
        row(`Cost per ${u}`, has ? money(uc) : '—');
      if (pu !== u) {
        html += row('Conversion', conv > 0 ? `1 ${u} = ${fmtQty(conv)} ${pu}` : '—') +
          row(`${plural(pu)} per batch`, net > 0 && conv > 0 ? fmtQty(net * conv) : '—');
      }
    } else {
      html += `<p class="sum-note">Recipes that use this item as an ingredient are costed at ${has ? money(uc) : 'this rate'} per ${u}.</p>`;
    }
    $('rcSummary').innerHTML = html;
  }

  function openForm(id = null) {
    editingId = id;
    const r = id ? byId(id) : null;
    const type = r ? r.type : (filter === 'SF' ? 'SF' : 'FG');
    draft = r ? JSON.parse(JSON.stringify(r)) : {
      type, categoryId: '', subCategoryId: '', foodType: 'veg', name: '', alias: '', sku: '', number: '',
      ...DEFAULTS[type], yield: 100, shelfLife: '', posUnit: '', conversion: '',
      menuSectionId: '', price: '', image: '', description: '', remarks: '', usedBy: [],
      ingredients: [{ ref: '', qty: '', unit: '', yield: 100 }],
    };
    draft.usedBy = draft.usedBy || [];
    draft.unitsTouched = !!r;
    draft.convAuto = !r || !r.posUnit || r.posUnit === r.outputUnit;

    $('rcTitle').textContent = r ? `Edit Recipe — ${r.name}` : 'New Recipe';
    $('rcSubtitle').textContent = r ? `${r.code} · ${TYPE_LABEL[r.type]}` : 'Fill in the details and ingredients. Cost is calculated automatically.';
    $('rcSubmit').textContent = r ? 'Update Recipe' : 'Save Recipe';
    $('rcName').value = draft.name;
    $('rcAlias').value = draft.alias || '';
    $('rcSku').value = draft.sku || '';
    $('rcNumber').value = draft.number || '';
    $('rcQty').value = draft.outputQty;
    $('rcYield').value = draft.yield;
    $('rcShelf').value = draft.shelfLife;
    $('rcPrice').value = draft.type === 'FG' ? draft.price : '';
    $('rcDesc').value = draft.description || '';
    $('rcRemarks').value = draft.remarks || '';
    document.querySelectorAll('#rcFood label').forEach(l => {
      l.classList.toggle('on', l.dataset.f === draft.foodType);
      l.querySelector('input').checked = l.dataset.f === draft.foodType;
    });
    const locked = r && r.type === 'SF' && usedIn(r.id).length;
    document.querySelector('#rcType label[data-t="FG"]').classList.toggle('locked', !!locked);
    document.querySelector('#rcType label[data-t="FG"]').title = locked ? 'Used as an ingredient in other recipes' : '';
    fillMenuSections();
    renderUsedBy();
    toggleUsedBy(false);
    showImage();
    setType(draft.type);
    $('rcModal').classList.add('show');
    $('rcModal').querySelector('.rc-main').scrollTop = 0;
  }
  $('rcAddBtn').addEventListener('click', () => openForm());

  $('rcForm').addEventListener('submit', e => {
    e.preventDefault();
    refresh();
    if ($('rcSubmit').disabled) return;
    const isFG = draft.type === 'FG';
    const data = {
      type: draft.type,
      categoryId: draft.categoryId,
      subCategoryId: draft.subCategoryId,
      foodType: draft.foodType,
      name: draft.name.trim(),
      alias: (draft.alias || '').trim(),
      sku: (draft.sku || '').trim().toUpperCase(),
      number: (draft.number || '').trim(),
      outputQty: +draft.outputQty,
      outputUnit: draft.outputUnit,
      yield: +draft.yield,
      shelfLife: draft.shelfLife === '' ? '' : +draft.shelfLife,
      // selling on POS — Finished Goods only
      menuSectionId: isFG ? draft.menuSectionId : '',
      posUnit: isFG ? posUnitOf(draft) : '',
      conversion: isFG ? convOf(draft) : '',
      price: isFG ? +draft.price : 0,
      image: isFG ? draft.image : '',
      description: (draft.description || '').trim(),
      remarks: (draft.remarks || '').trim(),
      usedBy: [...draft.usedBy],
      ingredients: draft.ingredients.filter(l => l.ref && +l.qty > 0)
        .map(l => ({ ref: l.ref, qty: +l.qty, unit: l.unit, yield: l.yield === '' ? 100 : +l.yield })),
    };
    const before = JSON.stringify(recipes);
    if (editingId) {
      const r = byId(editingId);
      if (r.type !== data.type) data.code = nextCode(data.type);
      Object.assign(r, data, { updatedAt: Date.now() });
    } else {
      recipes.push({ id: uid(), code: nextCode(data.type), ...data, createdAt: Date.now() });
    }
    if (!write(STORAGE_KEY, recipes)) { recipes = JSON.parse(before); return; }
    toast(`"${data.name}" ${editingId ? 'updated' : 'saved'}`);
    close();
    if (filter !== 'ALL' && filter !== data.type) filter = data.type;
    render();
  });
  function nextCode(type) {
    const n = recipes.filter(r => r.type === type).map(r => +(r.code.split('-R')[1] || 0));
    return `${type}-R${String((n.length ? Math.max(...n) : 0) + 1).padStart(3, '0')}`;
  }

  // ---------- Delete ----------
  let deletingId = null;
  function openDelete(id) {
    const r = byId(id);
    if (!r) return;
    const users = usedIn(id);
    deletingId = users.length ? null : id;
    $('rcConfirmDelete').style.display = users.length ? 'none' : '';
    $('rcDeleteText').innerHTML = users.length
      ? `<b>${esc(r.name)}</b> cannot be deleted because it is an ingredient in:<span class="warn">${users.map(u => esc(u.name)).join(', ')}</span><span class="warn" style="color:#6b7280">Remove it from those recipes first.</span>`
      : `Are you sure you want to delete <b>${esc(r.name)}</b> (<span class="code">${esc(r.code)}</span>)? This action cannot be undone.`;
    $('rcDeleteModal').classList.add('show');
  }
  $('rcConfirmDelete').addEventListener('click', () => {
    const r = byId(deletingId);
    if (!r) return close();
    recipes = recipes.filter(x => x.id !== deletingId);
    write(STORAGE_KEY, recipes);
    toast(`"${r.name}" deleted`, true);
    close();
    render();
  });

  function close() {
    $('rcModal').classList.remove('show');
    $('rcDeleteModal').classList.remove('show');
    editingId = deletingId = null;
  }
  document.querySelectorAll('[data-rc-close]').forEach(b => b.addEventListener('click', close));
  ['rcModal', 'rcDeleteModal'].forEach(id => $(id).addEventListener('mousedown', e => { if (e.target.id === id) close(); }));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('rcUsedBy').classList.contains('open')) return toggleUsedBy(false);
    close();
  });

  // category / menu section names may change on the other pages
  window.addEventListener('hashchange', () => { if (location.hash === '#recipe') render(); });
  window.addEventListener('storage', e => { if ([STORAGE_KEY, CAT_KEY, MS_KEY].includes(e.key)) { recipes = read(STORAGE_KEY); render(); } });
  window.rmsRecipeUsage = { menuSection: id => recipes.filter(r => r.menuSectionId === id).length };

  render();
})();
