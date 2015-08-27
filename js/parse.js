function ParseOperation() {

  var Place = Parse.Object.extend("place");
  var user_object = null;
  initial();

  function initial() {
  	
	// parse initial key pair
	Parse.initialize("49EAagj4X2cGg2FPlkwLfYPoQopCIFOaG4t021TB", "Vf9zWuWKcILLvCeE029O1c5QmCiTsZSMIrCjgVEi");

	// facebook initial login cookie check
    window.fbAsyncInit = function() {
        Parse.FacebookUtils.init({ // this line replaces FB.init({
            appId      : '1642885569256712', // Facebook App ID
            //status     : false,  // check Facebook Login status
            cookie     : true, 
            xfbml      : true,  // initialize Facebook social plugins on the page
            version    : 'v2.2' // point to the latest Facebook Graph API version
        });

        // Run code after the Facebook SDK is loaded.
        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                // the user is logged in and has authenticated your
                // app, and response.authResponse supplies
                // the user's ID, a valid access token, a signed
                // request, and the time the access token 
                // and signed request each expire

                document.getElementById('login_button').innerHTML =  'You are login!';
                console.log("log in!!!!");
                var uid = response.authResponse.userID;
                var accessToken = response.authResponse.accessToken;
                user_object = Parse.User.current();
                FB.api('/me', function(response) {
                    document.getElementById('login_button').innerHTML =  'Hi! '+ response.name + '~';
                    console.log('Successful login for: ' + response.name);
                });
            }else {
                document.getElementById('login_button').innerHTML =  '<img src="./img/sign-in-facebook.png" style="height:50px">';
                console.log("log out!!!!");
            }
        });
    };
  
  }

  this.fbLogin = function () {
    Parse.FacebookUtils.logIn(null, {
        success: function(user) {
            user_object = user;
            console.log(user);
            FB.api('/me', function(response) {
               document.getElementById('login_button').innerHTML =  'Hi! '+ response.name + '~';
               console.log('Successful login for: ' + response.name);
            });
        },
        error: function(user, error) {
          alert("User cancelled the Facebook login or did not fully authorize.");
        }
    });
  }


  this.setPopular = function(place_id, like , callback) {
    if(user_object === null)
      return;
	
    // find the place 
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
            object.save();
			if(callback)
				callback(value);
          });
          modifyDislikeSet(object , like , function(exist) {
            var value = 0;
            if(!exist && !like)
              value = -1;
            else if(exist && like)
              value = 1;
            object.increment("popular" , value);
            object.save();
			if(callback)
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
    place.set("popular", popular);
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
