function CenterControl(controlDiv, map, d) {

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'cursor';
  //controlUI.style.marginBottom = '22px';
  controlUI.style.textAlign = 'center';
  controlUI.style.padding = '10px';
  controlUI.style.width = '300px';
  controlUI.style.height = '400px';
  controlUI.style.overflowY = 'scroll';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.color = 'rgb(25,25,25)';
  controlText.className = "panel";
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlText.innerHTML = '<h3 style="color:blue;line-height:1.5em;font-size:2.5em;margin:0.2em;padding:0">' + d.name + "<h3>" + 
                          '<h5 style="color:#333333;margin:0;padding:0;font-size:1.2em">' + d.formatted_phone_number + "</h5>" +
                          '<h5 style="color:#333333;margin:0;padding:0;font-size:1.2em">' + d.formatted_address + "</h5>";

  if(d.opening_hours !== undefined) {
     var day = new Date();
     var text = d.opening_hours.weekday_text[day.getDay() - 1];
     text = text.substring(4,text.length);
     controlText.innerHTML += ('<h5 style="color:#333333;margin:0;padding:0;font-size:1.2em">' + text + "</h5>");
  }
  
  if(d.photos !== undefined) {
     for(var i in d.photos) {
        controlText.innerHTML += '</br><img style="-webkit-border-radius:5px" src='+d.photos[i].getUrl({'maxWidth': 270, 'maxHeight': 1000})+">";
     }
  }
    controlText.innerHTML += '<input type="Button" value="X" onClick="map.controls[google.maps.ControlPosition.RIGHT_CENTER].clear();">';
  controlUI.appendChild(controlText);


}
