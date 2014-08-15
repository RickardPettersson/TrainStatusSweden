var TSS = { 
  TrafikverketKey : 'c7956db41b9a469ca0fbbdf346cb4416',
  myLatitude : parseFloat('59.32893000000001'),
  myLongitude : parseFloat('18.06491'),
  StationList : [],
  HistoryStationList : [],
  HistoryStretchList : []
};

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getStationNameBySign(sign) {
  var result = $.grep(TSS.StationList, function(e){ return e.value == sign; });
  
  if (result.length == 0) {
    return 'N/A (' + sign + ')';
  } else if (result.length == 1) {
    // access the foo property using result[0].foo
    return result[0].label;
  } else {
    // multiple items found
    console.log('multiple stations with sign "' + sign + '"');
    return result[0].label;
  }
}

function LoadStorageStuff(callback) {
  //console.log('LoadStorageStuff 1');
  var _stationList = $.jStorage.get("StationList");
  if (!_stationList) {
    //console.log('LoadStorageStuff 2');
    PreloadTrainStations(callback);
  } else {
    TSS.StationList = _stationList;
    //console.log('_stationList', _stationList);
    
    callback();
  }
}

function PreloadTrainStations(callback) {
    // Request to load all stations
    var xmlRequest = "<REQUEST>" +
                        // Use your valid authenticationkey
                        "<LOGIN authenticationkey='" + TSS.TrafikverketKey + "' />" +
                        "<QUERY objecttype='TrainStation'>" +
                            "<FILTER/>" +
                            "<INCLUDE>Prognosticated</INCLUDE>" +
                            "<INCLUDE>AdvertisedLocationName</INCLUDE>" +
                            "<INCLUDE>LocationSignature</INCLUDE>" +
                            "<INCLUDE>LocationInformationText</INCLUDE>" +
                            "<INCLUDE>Geometry.WGS84</INCLUDE>" +
                        "</QUERY>" +
                     "</REQUEST>";
    $.ajax({
        type: "POST",
        contentType: "text/xml",
        dataType: "json",
        data: xmlRequest,
        success: function (response) {
            if (response == null) return;
            var itemObject = {};
            try {
            
                TSS.StationList = [];
                $(response.RESPONSE.RESULT[0].TrainStation).each(function (iterator, item)
                {
                    itemObject = item;
                    var t = item.Geometry.WGS84.replace('POINT (', '');
                    t = t.replace(')', '');
                    var pos = t.split(' ');
                    //console.log('WGS84', 'Lat: ' + pos[0] + ' - Lon: ' + pos[1]);
                    
                    //TSS.StationLocation[item.LocationSignature] = pos;
                    
                    var $lat1 = TSS.myLatitude;
                    var $lon1 = TSS.myLongitude;
                    var $lat2 = parseFloat(pos[0]);
                    var $lon2 = parseFloat(pos[1]);
                    
                    var distance = Math.round((6371*3.1415926*Math.sqrt(($lat2-$lat1)*($lat2-$lat1) + Math.cos($lat2/57.29578)*Math.cos($lat1/57.29578)*($lon2-$lon1)*($lon2-$lon1))/180), 1);
                    
                    // Create an array to fill the search field autocomplete.
                    //if (item.Prognosticated == true)
                    TSS.StationList.push({ label: item.AdvertisedLocationName, value: item.LocationSignature, distance: distance });
                });
    
                $.jStorage.set('StationList', TSS.StationList);
                
                callback();
            }
            catch (ex) {
              console.log('PreloadTrainStations - Exception', ex, itemObject);
            }
        }
    });
}