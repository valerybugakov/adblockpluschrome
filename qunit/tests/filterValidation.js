"use strict";

{
  const {parseFilter, parseFilters} = require("../../lib/filterValidation");
  const {BlockingFilter,
         ElemHideFilter,
         CommentFilter} = require("../../adblockpluscore/lib/filterClasses");

  QUnit.module("Filter validation");

  test("Detecting invalid filters", () =>
  {
    equal(parseFilter("||example.com^$unknown").error.type, "invalid-filter",
          "unknown option");
    equal(parseFilter("[foobar]").error.type, "unexpected-filter-list-header",
          "filter list header");
    equal(parseFilter("##[foo").error.type, "invalid-css-selector",
          "invalid selector");
    ok(
      /\b4\b/.test(parseFilters("!comment\r\n||example.com^\n\n##/").errors[0]),
      "error contains corresponding line number"
    );
  });

  test("Allowing valid filters", () =>
  {
    let text;
    let filter;

    text = "||example.com^";
    ({filter} = parseFilter(text));
    ok(filter instanceof BlockingFilter, "blocking filter parsed");
    equal(filter.text, text, "blocking filter text matches");

    text = '##div:first-child a[src="http://example.com"] > .foo + #bar';
    ({filter} = parseFilter(text));
    ok(filter instanceof ElemHideFilter, "elemhide filter parsed");
    equal(filter.text, text, "elemhide filter text matches");

    text = "! foo bar";
    ({filter} = parseFilter(text));
    ok(filter instanceof CommentFilter, "comment filter parsed");
    equal(filter.text, text, "comment filter text matches");

    equal(parseFilter("").filter, null, "empty filter parsed as 'null'");
  });

  test("Normalizing filters", () =>
  {
    let ws = " \t\r\n";
    let filterText = ws + "@@" + ws + "||" + ws + "example.com" + ws + "^" + ws;
    equal(parseFilter(filterText).filter.text, "@@||example.com^",
          "unnecessary spaces");
    equal(parseFilter(ws).filter, null, "only spaces");
  });

  test("Parsing multiple filters", () =>
  {
    let result = parseFilters("||example.com^\n \n###foobar\r\n! foo bar\n");

    equal(result.errors.length, 0, "no error occurred");
    equal(result.filters.length, 3, "all filters parsed");

    ok(result.filters[0] instanceof BlockingFilter, "1st filter is blocking");
    equal(result.filters[0].text, "||example.com^", "1st filter text matches");

    ok(result.filters[1] instanceof ElemHideFilter, "2nd filter is elemhide");
    equal(result.filters[1].text, "###foobar", "2nd filter text matches");

    ok(result.filters[2] instanceof CommentFilter, "3rd filter is comment");
    equal(result.filters[2].text, "! foo bar", "3rd filter text matches");
  });
}
