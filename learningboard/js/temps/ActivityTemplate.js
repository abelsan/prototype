define(['mdls/User', 'mdls/Activity', 'temps/Template', 'temps/ListElement',
'lib/ViewDispatcher'], function(User, Activity, Template, ListElement,
ViewDispatcher) {"use strict";

  var ActivityTemplate = function(activity, index)
  {
    // index: for the order of display
    // inherits Template

    if (index === undefined) throw "hehe";
    this.model = new Activity(activity);
    ListElement.call(this, ++index);

    if(activity){
      this.model = new Activity(activity);
    }
    var html = '';
    var $html, $dif;
    var activityControl;

    if(User.is_staff() && location.href.includes('board_edit.html')){
      activityControl = `
      <div class="control" data-id="${this.model.id}">
        <ul>
          <li ${this.model['status'] == 0 ? 'class="hidden"' : ''}>
            <span class="glyphicon glyphicon-floppy-remove" aria-hidden="true"></span>
          </li>
          <li ${this.model['status'] == 0 ? '' : 'class="hidden"'}>
            <span class="glyphicon glyphicon-floppy-saved" aria-hidden="true"></span>
          </li>
          <li>
            <span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>
          </li>
          <li>
            <span class="glyphicon glyphicon-remove" name="removeBtn" aria-hidden="true"></span>
          </li>
        </ul>
      </div>`;
    }
    else
    {
      activityControl = `
      <div class="control" data-id="${this.model.id}">
        <ul class="text-muted">
          <li>
            <span class="glyphicon glyphicon-share" aria-hidden="true"></span>
            Share
          </li>
          <li class="markAsComplete">
            <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
            Mark as complete
          </li>
          <li>
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
            Delete
          </li>
        </ul>
      </div>`;
    }
    $html = $(`
      <div class="activity ${this.model.published() ? '' : 'unpublish'}">
        <h2 class="index">${this.index < 10 ? '0' + this.index : this.index}</h2>
        <p class="title lead">${this.model['title']}</p>
        <p class="text-muted">
          Posted date: ${new Date(this.model.createdAt).toDateString()}<br/>
          Author/Publisher: <a href="#">Dr. Abel Sanchez</a>
        </p><br/>
        <div class="row">
          <div class="col-md-12">
            <div name="dif"> </div>
          </div>
          <div class="col-md-12">
            <div class="description">${this.model.description}</div>
          </div>
        </div>
        ${activityControl}
      </div>
    `);
    $dif = $html.find("[name='dif']");
    var Resource = ViewDispatcher.activities.getView(this.model.type);
    var rsc = new Resource(this.model.data);
    rsc.display($dif);

    Template.call(this, $html);
  };

  ActivityTemplate.prototype.updateIndex = function(index)
  {
    this.index = index++;
    this.$template.find(".index").html(index < 10 ? '0' + index : index);
  }

  $.extend(ActivityTemplate.prototype, Template.prototype, ListElement.prototype);

  return ActivityTemplate;
});
