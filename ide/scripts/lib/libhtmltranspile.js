/**
 * libGAS2HTML - exports GAS scripts to HTML+CSS
 * Note: This is a one-way operation
 */
var HtmlTranslator = (function () {
  var HtmlTranslator = {};
  HtmlTranslator.fromHtml = function (html) {
    throw new Error('HtmlTranslator is one-way.');
  }
  HtmlTranslator.toHtml = function (gas) {
    
  };
  return HtmlTranslator;
})();
