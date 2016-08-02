define(['temps/Template', 'mdls/Text'], function(Template, Text) {
  "use strict";

  var TextTemplate = function(text) {

    this.model = new Text(text);

    var link = this.model.text_image;
    if (link === '') link = "img/placeholder-no-image.png";
    console.log(link);

    var $html = $(`
      <img src="${link}" allowfullscreen></img>
    `);

    Template.call(this, $html);
  }

  $.extend(TextTemplate.prototype, Template.prototype)

  return TextTemplate;
});