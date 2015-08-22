function ParseOperation() {

  this.setPopular = function(place_id, ari_type) {
    var PopularObject = Parse.Object.extend("place");
    var query = new Parse.Query(PopularObject);
    var finalCase = 0;
      query.equalTo("place_id",place_id);
      query.find({
        success: function(results) {
          console.log("get place success!" + results);
          if (results.length > 0) {
            var object = results[0];
                if (ari_type === 1) {
                  object.increment("popular");
                  addLikedPlace(object);
                  console.log("like");
                }
                else {
                  console.log("dislike");
                  object.set("popular", object.get("popular") - 1);
                  removeLikedPlace(object);
                }
                object.save(null, {
                  success: function(result) {
                    console.log("save popular!" + result);
                  },
                  error: function(gameScore, error) {
                    alert('Failed to create new object, with error code: ' + error.message);
                  }
                });
                
          }
          else {
            var popularObject = new PopularObject();
            popularObject.set("place_id", place_id);
            if (ari_type == 1) {
              popularObject.set("popular", 1);
              addLikedPlace(object);
            }
            else {
              popularObject.set("popular", -1);
              removeLikedPlace(object);
            }
            popularObject.save(null, {
              success: function(object) {
                console.log('New object created with objectId: ' + popularObject.id);
                addLikedPlace(object);
              },
              error: function(model, error) {
                alert('Failed to create new object, with error code: ' + error.message);
              }
            });
          }
        },
        error: function(error) {
          alert("Error: " + error.code + " " + error.message);
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
        	console.log(place.place_id);
            alert("Error: " + error.code + " " + error.message + ' ' + place_id);
        }
      });
  }

  this.addPopular = function(place_id) {
    this.setPopular(place_id, this.getPopular(place_id) + 1);
  }

  this.minusPopular = function(place_id) {
    this.setPopular(place_id, this.getPopular(place_id) - 1);
  }

  function addLikedPlace (place) {
    var likeSet = user_object.relation("likes");
    likeSet.add(place);
    var dislikeSet = user_object.relation("dislikes");
    dislikeSet.remove(place);
    user_object.save(null, {
                  success: function(result) {
                    console.log("save like place!" + result);
                  },
                  error: function(gameScore, error) {
                    alert('Failed to create new object, with error code: ' + error.message);
                  }
                });
  }

  function removeLikedPlace (place) {
    var dislikeSet = user_object.relation("dislikes");
    dislikeSet.add(place);
    var likeSet = user_object.relation("likes");
    likeSet.remove(place);
    user_object.save(null, {
                  success: function(result) {
                    console.log("save dislike place!" + result);
                  },
                  error: function(gameScore, error) {
                    alert('Failed to create new object, with error code: ' + error.message);
                  }
                });
  }
}
