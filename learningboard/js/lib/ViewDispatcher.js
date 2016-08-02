define(['temps/VideoTemplate', 'temps/TextTemplate', 'temps/CodeTemplate', 'temps/AudioTemplate', 'temps/GDriveTemplate'], function(VideoTemplate, TextTemplate, CodeTemplate, AudioTemplate, GDriveTemplate) {
  "use strict";

  var tmp;
  var actTypes = {
    'video': {
      createFormView: 'temps/activities/VideoFormTemplate'
    },
    'text': {
      createFormView: 'temps/activities/TextFormTemplate'
    },
    'code': {
      createFormView: 'temps/activities/CodeFormTemplate'
    },
    'audio': {
      createFormView: 'temps/activities/AudioFormTemplate'
    },
    'gdrive': {
      createFormView: 'temps/activities/GDriveFormTemplate'
    }
  };

  var expo = {
    activities: {
      getTypes: function() {return Object.keys(actTypes)},
      getView: function(type) {
        switch(type)
        {
          case 'video':
            tmp = VideoTemplate;
            break;
          case 'text':
            tmp = TextTemplate;
            break;
          case 'code':
            tmp = CodeTemplate;
            break;
          case 'audio':
            tmp = AudioTemplate;
            break;
          case 'gdrive':
            tmp = GDriveTemplate;
            break;
          default:
            tmp = DefaultActivityTemplate;
            break;
        }
        return tmp;
      },

      getCreateFormView: function (type) {
        return new Promise(function(resolve, reject) {
          try {
            require([actTypes[type].createFormView], function(){
              tmp = new arguments[0]();
              resolve(tmp);
            });
          } catch (e) {
            reject(e);
          }
        });
      }
    }
  };

  return expo;

});
