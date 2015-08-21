function CenterControl(controlDiv, map, d) {

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginBottom = '22px';
  controlUI.style.textAlign = 'left';
  controlUI.title = 'Resturant Information';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlText.style.fontSize = '16px';
  controlText.style.lineHeight = '38px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.innerHTML = "Name : " + d.name + "<br>" + 
                          "Phone : " + d.formatted_phone_number + "<br>" +
                          "Address : " + d.formatted_address + "<br>" +
                          "Opening hours : ";
  if(d.opening_hours === undefined)
            controlText.innerHTML += "No Information";
  else {
     var day = new Date();
     var text = d.opening_hours.weekday_text[day.getDay() - 1];
     var text1 = "";

     for(var i = 0 ; i < text.length ; i++) {
      if (i > 4)
        text1 += text[i];
     }
     controlText.innerHTML += text1;
  }
  
  if(d.photos !== undefined)
    controlText.innerHTML += "<br><img src="+d.photos[0].getUrl({'maxWidth': 200, 'maxHeight': 200})+">";
    controlText.innerHTML += '<br><input type="Button" value="Close" onClick="map.controls[google.maps.ControlPosition.RIGHT_CENTER].clear();">';
  //var maxWidth = 100;
  controlUI.appendChild(controlText);


}
