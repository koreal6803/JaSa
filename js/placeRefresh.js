function PlaceRefresh(googleMap , googlePlace){
    
    // _places contain all places in present view
    var _places = [];

    // keyword use for search places
    var _keyword;

    // callback function after search places of the view
    var _callbackPlaces;

    // callback function after detial search of a place
    var _callbackDetial;

    // process queue for detail informations of a place
    var _detialSearchQueue = [];
    
    // prcess id for searching detail informations of a place
    var _invervalProcessID;

    var _keywordSearchBox;

    // set keyword
    this.setKeyword = function(key){
        _keyword = key;
    };

    // _callbackPlaces function will be call whenever view of places are updated
    this.onUpdatePlaces = function (callback) {
      _callbackPlaces = callback;
    }

    // _callbackDetial function will be call whenever the detial of place are searched
    this.onAddPlaceDetial = function(callback) {
      _callbackDetial = callback;
    }

    // nearbySearch will search 20 places in the view
    this.nearbySearch = function() {
      var request = {
        bounds: googleMap.getBounds(),
        types: ['restaurant']
      };
      if(_keywordSearchBox !== undefined && _keywordSearchBox.value !== "")
          request.keyword = _keywordSearchBox.value;
      googlePlace.nearbySearch(request, updatePlace);
    };

    // radarSearch will search 200 places in the view
    this.radarSearch = function() {
      var request = {
        bounds: googleMap.getBounds(),
        keyword: _keyword
      };
      googlePlace.radarSearch(request, updatePlace);
    };

    this.setKeywordSearchBox = function (textBox) {
        _keywordSearchBox= textBox;
    };

    // after nearby/radarSearch, unpdatePlace will be call to update _places
    var updatePlace = function(results , status){

      // check results
      if (status != google.maps.places.PlacesServiceStatus.OK) {
        console.log(status);
        return;
      }

      // remove places
      var oldPlaceIdx = []
      for (var i in _places) {
        if(findPlaceID(results , _places[i].place_id) === -1){
          oldPlaceIdx.push(i);
          _places.splice(i, 1);
          i--;
        }
      }
      // add places
      var newPlaces = [];
      for (var i in results) {
        if(findPlaceID(_places , results[i].place_id) === -1) {

          var newPlace = {
            place_id : results[i].place_id,
            lat : results[i].geometry.location.K,
            lng : results[i].geometry.location.G,
            info : results[i]
          };
          console.log(results[i]);
          newPlaces.push(newPlace);
          _places.push(newPlace);
        }
      }

      // callback function to update places
      _callbackPlaces(oldPlaceIdx , newPlaces , _places);

      // push to queue for detial search
      for (var i in newPlaces)
        _detialSearchQueue.push(newPlaces[i]);
      
      //_invervalProcessID = window.setInterval(detailSearch, 10000);
    };

    var detailSearch = function() {

      // all places are searched
      if(_detialSearchQueue.length === 0){
        window.clearInterval(_invervalProcessID);
        return;
      }

      // search a place in queue
      var place = _detialSearchQueue.pop();
      googlePlace.getDetails({"placeId":place.place_id} , function(results , status){
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          console.log(status);
          return;
        }
        _callbackDetial(results);
      });
    }

    var findPlaceID = function(array , placeID){
      for(var i in array)
        if (array[i].place_id == placeID)
          return i;
      return -1;
    };
};
