module.exports = function() {

  return <>

    <p>Boolean attributes: literal JSX -> Lilact correct; pasted-as-HTML examples below intentionally look wrong</p>
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>Boolean: disabled={false} (should NOT render disabled)</h3>
      <input disabled={false} />

      <h3>Boolean: disabled (presence) (should render disabled)</h3>
      <input disabled />

      <h3>Boolean: readOnly={false} (should NOT be readonly)</h3>
      <input readOnly={false} defaultValue="Try editing (should be editable)" />

      <h3>Boolean: readOnly (presence) (should be readonly)</h3>
      <input readOnly defaultValue="Readonly (pasted HTML demo should be wrong)" />

      <h3>Boolean: required={false} (should NOT be required)</h3>
      <input required={false} placeholder="Not required" />

      <h3>Boolean: required (presence) (should be required)</h3>
      <input required placeholder="Required" />

      <h3>Boolean: checked={false} (checkbox should be unchecked)</h3>
      <input type="checkbox" checked={false} onChange={() => {}} />

      <h3>Boolean: checked={true} (checkbox should be checked)</h3>
      <input type="checkbox" checked={true} onChange={() => {}} />

      <h3>Boolean: multiple={false} (select should NOT allow multiple)</h3>
      <select multiple={false}>
        <option>A</option>
        <option>B</option>
      </select>

      <h3>Boolean: multiple (presence) (select should allow multiple)</h3>
      <select multiple>
        <option>A</option>
        <option>B</option>
      </select>

      <h3>Boolean: autoFocus={false} (should NOT steal focus)</h3>
      <input autoFocus={false} defaultValue="No autofocus (Lilact)" />

      <h3>Boolean: autoFocus (presence) (should autofocus)</h3>
      <input autoFocus defaultValue="Autofocus (Lilact)" />

      <hr />

      <h3>Select: value="b" (Lilact selects option b)</h3>
      <select value="b" onChange={() => {}}>
        <option value="a">A</option>
        <option value="b">B</option>
        <option value="c">C</option>
      </select>

      <hr />

      {/* Uncontrolled components: defaultValue/defaultChecked (Lilact sets initial, then DOM updates) */}
      <h3>Uncontrolled input: defaultValue (initial value, then user can edit)</h3>
      <input defaultValue="Uncontrolled after mount" />

      <h3>Uncontrolled checkbox: defaultChecked (initially checked, then user toggles)</h3>
      <input type="checkbox" defaultChecked />
      
      <hr />

      {/* checked vs value pitfall */}
      <h3>Checkbox using value attribute (NOT the checked state in Lilact)</h3>
      <input type="checkbox" value="on" onChange={() => {}} />

      <h3>Checkbox using checked prop (checked state in Lilact)</h3>
      <input type="checkbox" checked onChange={() => {}} />

      <hr />

      {/* JSX camelCase: works in Lilact; if pasted literally into HTML it’s “visibly wrong” because HTML won’t interpret JSX props */}
      <h3>JSX attribute casing: className="..." (Lilact applies class; pasted HTML uses className literally)</h3>
      <div className="demo" style={{ padding: 8, border: "1px solid #888" }}>
        className target
      </div>

      <h3>HTML uses class; Lilact uses className (pasted HTML would ignore className)</h3>
      <div class="demo" style={{ padding: 8, border: "1px solid #888" }}>
        (This one uses class, so pasted HTML is correct.)
      </div>

      <h3>JSX attribute casing: htmlFor="x" (Lilact links label; pasted HTML uses htmlFor literally)</h3>
      <label htmlFor="x_Lilact">Click label (Lilact should focus input)</label>
      <input id="x_Lilact" type="text" placeholder="Focus target" />

      <h3>Corresponding plain HTML: for="x" (works in both)</h3>
      <label htmlFor="y_html">Click label (HTML should focus input)</label>
      <input id="y_html" type="text" placeholder="Focus target" />

      <h3>JSX: tabIndex={2} (Lilact sets focus order; pasted HTML won’t)</h3>
      <input tabIndex={2} defaultValue="tabIndex Lilact" />

      <h3>JSX: readOnly={true} (Lilact makes readonly; pasted HTML won’t interpret readonly={true})</h3>
      <input readOnly={true} defaultValue="readonly (Lilact)" />

      <h3>JSX: maxLength={5} (Lilact enforces length; pasted HTML won’t parse maxLength={5})</h3>
      <input maxLength={5} defaultValue="123456789" />
      <p style={{ margin: "4px 0 0" }}>
        Type/try to enter more: Lilact will limit to 5 chars; pasted HTML won’t.
      </p>
    </div>
  </>
}