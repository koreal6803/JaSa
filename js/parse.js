function ParseOperation() {
  
  var _returnBoolean;
  var _places;


  this.setPopular = function(place_id, ari_type) {
    var PopularObject = Parse.Object.extend("place");
    var query = new Parse.Query(PopularObject);
    var finalCase = 0;
      query.equalTo("place_id",place_id);
      query.find({
        success: function(results) {
          if (results.length > 0) {
            var PopularObject = Parse.Object.extend("place");
            var query = new Parse.Query(PopularObject);
            query.equalTo("place_id",place_id);
            query.find({
              success: function(results) {
                alert("Successfully retrieved " + results.length + " scores.");
                // Do something with the returned Parse.Object values
                var object = results[0];
                if (ari_type === 1)
                  object.increment("popular");
                else
                  object.set("popular", object.get("popular") - 1);
                object.save();
               },
              error: function(error) {
                alert("Error: " + error.code + " " + error.message);
              }
            });          
          }
          else {
            var PopularObject = Parse.Object.extend("place");
            var popularObject = new PopularObject();
            popularObject.set("place_id", place_id);
            if (ari_type == 1)
              popularObject.set("popular", 1);
            else
              popularObject.set("popular", 0);
            popularObject.save(null, {
              success: function(object) {
                alert('New object created with objectId: ' + popularObject.id);
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
        },
        error: function(error) {
        	console.log(place.place_id);
            alert("Error: " + error.code + " " + error.message + ' ' + place_id);
        }
      });
  }
  this.onReturnBoolean = function(callback) {
    _returnBoolean = callback;
  }
  
  this.addPopular = function(place_id) {
    this.setPopular(place_id, this.getPopular(place_id) + 1);
  }

  this.minusPopular = function(place_id) {
    this.setPopular(place_id, this.getPopular(place_id) - 1);
  }
}