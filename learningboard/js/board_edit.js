define(['util', 'mdls/User', 'mdls/Activity', 'temps/ActivityTemplate', 'temps/SortableListTemplate', 'temps/ActivityListTemplate', 'temps/ActivityTabTemplate', 'lib/ViewDispatcher', 'jquery_ui', 'fileinput', 'select2'], function (util, user, Activity, ActivityTemplate, SortableListTemplate, ActivityListTemplate, ActivityTabTemplate, ViewDispatcher, ui, fi) {

  var pk;
  var cover_img;
  var tag_list = [];
  var activity_index = 0;
  var actList;
  var actFormTemp = {};

  var afterCreateActivityCallback = function(act) {
    var index = actList.length;
    actList.addElement(new ActivityTemplate(act, index, null));
    $('#collapseAddActivity').collapse('hide');
  };
  var afterEditActivityCallback = function(act) {
    console.log(act);
    var index = actList.getIdList().indexOf(act.id);
    actList.updateElementAt(new Activity(act), index);
    $('#collapseAddActivity').collapse('hide');
  };

  $.getCSS('https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/css/select2.min.css');

  $(function(){
    // load category data
    var actTempList = [];
    util.get('/category/',
      function(res)
      {
        var data = res.data;
        for(var i = 0; i < data.category.length; i++){
          $('select[name=category]')
          .append(`
            <option value="${data.category[i].id}">
              ${data.category[i].name}
            </option>`
          );
        }
      }
    );

    // reset data for new board
    if(location.search.includes('?new')){
      $("div[class=curated_by] span").text(user.getInfo().username);

      $('.navbar-nav li:not(:first) a').css({
        color: '#CCC',
        cursor: 'not-allowed'
      });

      initCoverImage('img/placeholder-no-image.png');

      actList = new SortableListTemplate(new ActivityListTemplate(), util.urls.actOrder);
      actList.display($(".activityListContainer"));
    } else if(/\?\d+/.test(location.search)){ // assign value to field when editing the board
      pk = location.search.replace('?', '');
      util.get('/lb/'+pk+'/',
        function(res){
          // get the info of the board with pk
          var board = res.data.learningboard;
          if(board.publish == 1){
            $('.publishBoardBtn').parent().addClass('hidden');
            $('.unpublishBoardBtn').parent().removeClass('hidden');
          }
          if(board.tags){
            board.tags.map(function(item){
              tag_list.push(item.id);
              $('.tagList ul')
              .append(`
                <li data-id="${item.id}">
                  ${item.tag} <span>x</span>
                </li>`
              );
            });
          }
          $('form.addBoardForm input[name=title]')
          .val(board.title)
          .trigger('keydown');
          $("div[class=curated_by] span").text(board.author.username);
          $('form.addBoardForm textarea[name=description]')
          .val(board.description);
          $('form.addBoardForm input[name=level][value='+board.level+']')
          .prop('checked', true);
          if(board.activities && board.activities.length > 0){
            $('.activityListContainer .noActivity').hide();
            var activities = board.activities;
            var length = activities.length;
            var actTemps = util.arrayMapping(activities,
              function(activity, index) {
              return new ActivityTemplate(activity, index, null);
            });
            actList = new SortableListTemplate(new ActivityListTemplate(actTemps));
            actList.display($(".activityListContainer"));
          }
          else
          {
            actList = new SortableListTemplate(new ActivityListTemplate());
            actList.display($(".activityListContainer"));
          }
          $('.navbar-nav li:not(:first) a').css({});
          initCoverImage(board.coverImage ? util.urls.media_addr + '/' + board.coverImage: "img/placeholder-no-image.png");
        },
        function(){
          alert('Learning Board not found');
          location.href = 'boards.html';
        }
      );
    }
    else{
      alert('Learning Board not found');
      location.href = 'boards.html';
      return false;
    }
    $(".btn.sortLockMode").on("click", function() {
      actList.toggleSortingEnabled();
      if (actList.sortingEnabled) {$(this).html("Sorting Enabled");}
      else {$(this).html("Sorting Disabled");}
    })

    // render add/edit activity form
    var actTypes = ViewDispatcher.activities.getTypes();
    var actFormPromise = actTypes.reduce(function(array, act){
      var promise = new Promise(function(resolve, reject) {
        ViewDispatcher.activities.getCreateFormView(act).then(function(form) {
          if (!form) return resolve();
          if (pk) {
            form.setLearningBoardId(pk);
          }
          form.setAfterCreate(afterCreateActivityCallback);
          form.setAfterEdit(afterEditActivityCallback);
          form.display($('.activityForm'));
          actFormTemp[form.type] = form;
          resolve(form);
        }).catch(function(err) {
          resolve();
        });
      });
      array.push(promise);
      return array;
    }, []);
    Promise.all(actFormPromise).then(function(result) {
      result.forEach(function(form) {
        if (form) {
          var tab = new ActivityTabTemplate(form);
          tab.display($('#activityTab'));
        }
      });
    }).catch(function(e){
      throw e;
    });

    // board title word count
    $('#boardTitle').on('keydown', function(e){
      $('#boardTitleCount').text(150 - $(this).val().length);
    });

    // tag remove
    $(document).on('click', '.tagList ul li span', function(e){
      var $this = $(this).parent();
      $this.fadeOut('fast', function(){
        $this.remove();
        tag_list.splice(tag_list.indexOf($this.data('id')), 1);
      });
    });

    // tag add modal
    $('#addTagModal').on('shown.bs.modal', function(e){
      var modal = $(this);
      var tag = modal.find('.modal-body select[name=tag]');
      util.get('/tag/',
        function(data){
          data = data.data.tag.map(function(item){
            return {
              id: item.tag,
              text: item.tag
            }
          }
        );
        tag.select2({
          placeholder: 'Enter or search tag',
          multiple: true,
          tags: true,
          data: data,
          minimumInputLength: 1
        });
      });
      modal.find('.modal-footer button:eq(1)').off('click').on('click', function(e){
        e.preventDefault();
        var tagArray = tag.val();
        if(tagArray.length > 0){
          for(var i = 0; i < tagArray.length; i++){
            var item = tagArray[i];
            (function(item){
              util.post('/tag', {tag: item},
                function(data)
                {
                  var id = data.data.tag.id;
                  if(tag_list.indexOf(id) === -1){
                    tag_list.push(id);
                    $('.tagList ul').append(`<li data-id="${id}">${item} <span>x</span></li>`);
                  }
                }
              );
            })(item);
          }
        }
        $('#addTagModal').modal('hide');
        tag.select2('val', '');
      });
    });

    // save board
    $('a.addBoardBtn').on('click', function(e)
    {
      e.preventDefault();
      // trigger html5 validation
      if(!$('form.addBoardForm')[0].checkValidity()){
        $('form.addBoardForm button[type=submit]').trigger('click');
        return;
      }
      var dataObject = $('form.addBoardForm').serializeObject();
      if (cover_img) {
        dataObject.coverImage = cover_img;
      } else {
        dataObject.coverImage = null;
      }
      if(tag_list){
        dataObject.tags = tag_list;
      }
      dataObject.activities = actList.getIdList();
      if(pk){
        util.put('/lb/'+pk+'/', dataObject,
          function(res)
          {
            alert('Board saved');
          }
        );
      }else{
        dataObject.author = user.getId();
        console.log(dataObject);
        util.post('/lb/', dataObject,
          function(res)
          {
            console.log(res);
            location.href = 'board_edit.html?' + res.data.learningboard.id;
          }
        );
      }
    })

    // delete board
    $('a.deleteBoardBtn').on('click', function(e)
    {
      e.preventDefault();
      if(!pk) return false;
      var r = confirm('Are you sure to delete the board?');
      if(r){
        util.delete('/lb/'+pk+'/',
          function(data)
          {
            alert('Board deleted');
            location.href = 'boards.html';
          }
        );
      }
    })

    // publish board
    $('a.publishBoardBtn').on('click', function(e)
    {
      e.preventDefault();
      if(!pk) return false;
      util.post('/lb/publish/'+pk+'/', {publish: true},
        function(data)
        {
          $('.publishBoardBtn').parent().addClass('hidden');
          $('.unpublishBoardBtn').parent().removeClass('hidden');
          alert('Board published');
        }
      );
    })

    // unpublish board
    $('a.unpublishBoardBtn').on('click', function(e)
    {
      e.preventDefault();
      if(!pk) return false;
      util.post('/lb/publish/'+pk+'/', {publish: false},
        function(data)
        {
          $('.publishBoardBtn').parent().removeClass('hidden');
          $('.unpublishBoardBtn').parent().addClass('hidden');
          alert('Board unpublished');
        }
      );
    })

    // preview board
    $('a.previewBoardBtn').on('click', function(e)
    {
      e.preventDefault();
      if(!pk) return false;
      window.open('board_preview.html?' + pk,'_blank');
    });

    // add activity collapse
    $('#collapseAddActivity').on('show.bs.collapse', function(e){
      $('#addActivityBox .panel-title a').text('- Add/Edit Learning Activity');
    });

    $('#collapseAddActivity').on('hide.bs.collapse', function(e){
      $('#addActivityBox .panel-title a').text('+ Add/Edit Learning Activity');
    });

    // edit activity
    $(document).on('click', '.activity span.glyphicon-pencil', function(e){
      var id = $(this).parents('div.control').data('id');
      util.get('/activity/'+id+'/',
        function(res)
        {
          var data = res.data.activity;
          $('#collapseAddActivity').collapse('show');
          $('#activityTab a[href="#'+data.type+'"]').tab('show');
          actFormTemp[data.type].setData(data);
          $('html, body')
          .animate({ scrollTop: $('#addActivityBox').offset().top }, 500);
        }
      );
    });

    // remove activity
    $(document).on('click', '.activity span.glyphicon-remove', function(e){
      var $this = $(this).parents('div.activity');
      var r = confirm('Are you sure to delete this activity?');
      if(!r) return;
      var id = $(this).parents('div.control').data('id');
      util.delete(
        '/activity/'+id+'/',
        function(data)
        {
          actList.removeElementBy({id: id}, {fadeOut: true});
        }
      );
    });
  });

  function initCoverImage(url){
    var instance = $('.uploadImage').fileinput('destroy').fileinput({
      overwriteInitial: true,
      showClose: false,
      showCaption: false,
      showBrowse: false,
      browseOnZoneClick: true,
      removeLabel: 'Remove cover image',
      removeClass: 'btn btn-default btn-block btn-xs',
      defaultPreviewContent: `<img src="${url}" alt="Cover Image" class="img-responsive">
      <h6 class="text-muted text-center">Click to select cover image</h6>`,
      layoutTemplates: {
        main2: '{preview} {remove}',
        footer: ''
      },
      allowedFileTypes: ['image']
    });
    (function(instance){
      instance.off('fileloaded').on('fileloaded', function(e, file, previewId, index, reader){
        util.post('/media', {data: reader.result}, function(res) {
          cover_img = res.data.file;
        });
      });
      instance.off('filecleared').on('filecleared', function(e){
        initCoverImage('img/placeholder-no-image.png');
        cover_img = undefined;
      });
    })(instance);
  }

});
