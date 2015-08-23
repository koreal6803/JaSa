function ParseOperation() {

  var Place = Parse.Object.extend("place");


  this.setPopular = function(place_id, like , callback) {
    if(user_object === null)
      return;
    console.log("likd: "+like);
    var query = new Parse.Query(Place);
    var finalCase = 0;
      query.equalTo("place_id",place_id);
      query.find({
        success: function(results) {

          if (results.length === 0) {
              console.log("create new places");
              var population = (like)?1:-1;
              createPlaceObj(place_id , population , function(object) {
              modifyLikeSet(object , like);
              modifyDislikeSet(object , like);
            });
            return;
          }
          console.log("places already exist");

          var object = results[0];

          modifyLikeSet(object , like , function(exist) {
            var value = 0;
            if(!exist && like)
              value = 1;
            else if(exist && !like)
              value = -1;
            object.increment("popular" , value);
            console.log("like check value: " + value);
            object.save();
            callback(value);
          });
          modifyDislikeSet(object , like , function(exist) {
            var value = 0;
            if(!exist && !like)
              value = -1;
            else if(exist && like)
              value = 1;
            object.increment("popular" , value);
            console.log("dislike check value: " + value);
            object.save();
            callback(value);
          });
        },
        error: function(error) {
          console.log("Error: " + error.code + " " + error.message);
        }
      });  
  }

  this.getPopular = function(place , callback) {
    var PopularObject = Parse.Object.extend("place");
    var query = new Parse.Query(PopularObject);

      query.equalTo("place_id",place.place_id);
      query.find({
        success: function(results) {
          if(results.length > 0)
          	callback(results[0].get('popular'),place);
          else
          	callback(0,place);
        },
        error: function(error) {
          console.log("Error: " + error.code + " " + error.message);
        }
      });
  }

  function createPlaceObj (place_id, popular, callback) {
    var place = new Place();
    place.set("place_id", place_id);
    place.save(null, {
      success: function(object) {
        if(callback !== undefined)
          callback(object);
      },
      error: function(model, error) {
        console.log('Failed to create new object, with error code: ' + error.message);
      }
    });
  }

  function modifyLikeSet (place , like , callback) {
    var likeSet = user_object.relation("likes");

    likeSet.query().find({
      success: function(list) {
        // list contains the posts that the current user likes.
        var exist = false;
        var index = null;
        for(var i in list) {
          if (list[i].get("place_id") == place.get("place_id")) {
            exist = true;
            index = i;
            break;
          }
        }

        if(callback !== undefined)
          callback(exist);

        if(!exist && like)
          likeSet.add(place);
        else if(exist && !like)
          likeSet.remove(list[index]);
        user_object.save();
      }
    });
  }

  function modifyDislikeSet (place , like , callback) {
    var dislikeSet = user_object.relation("dislikes");

    dislikeSet.query().find({
      success: function(list) {
        // list contains the posts that the current user likes.
        var exist = false;
        var index = null;
        for(var i in list) {
          if (list[i].get("place_id") == place.get("place_id")) {
            exist = true;
            index = i;
            break;
          }
        }

        if(callback !== undefined)
          callback(exist);

        if(!exist && !like)
          dislikeSet.add(place);
        else if(exist && like)
          dislikeSet.remove(list[index]);
        user_object.save();
      }
    });
  }
}
