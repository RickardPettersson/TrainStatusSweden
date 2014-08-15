$(document).on( "pageinit", "#trainPage", function() {
    $.mobile.loading("show");
    
    $.support.cors = true; // Enable Cross domain requests
    try {
        $.ajaxSetup({
            url: "http://api.trafikinfo.trafikverket.se/v1/data.json",
            error: function (msg) {
                if (msg.statusText == "abort") return;
                alert("Request failed: " + msg.statusText + "\n" + msg.responseText);
            }
        });
    }
    catch (e) { alert("Ett fel uppstod vid initialisering."); }
        
    $.mobile.loading("show");
    
    LoadStorageStuff(function() {
      var trainNumber = getParameterByName('train');
      
      SearchTrain(trainNumber);
      
      $(window).scrollTop(0);
      
      $.mobile.loading("hide");
    });
});

function UpdateTrainInfo() {
  var trainNumber = getParameterByName('train');
  
  SearchTrain(trainNumber);
  
  $(window).scrollTop(0);
  
  $.mobile.loading("hide");
}

function SearchTrain(trainNumber) {

    // Request to load announcements for a station by its signature
    var xmlRequest = "<REQUEST version='1.0'>" +
                        "<LOGIN authenticationkey='" + TSS.TrafikverketKey + "' />" +
                        "<QUERY objecttype='TrainAnnouncement' " +
                            "orderby='AdvertisedTimeAtLocation' >" +
                            "<FILTER>" +
                            "<AND>" +
                                "<OR>" +
                                    "<AND>" +
                                        "<GT name='AdvertisedTimeAtLocation' " +
                                                    "value='$dateadd(-08:00:00)' />" +
                                        "<LT name='AdvertisedTimeAtLocation' " +
                                                    "value='$dateadd(14:00:00)' />" +
                                    "</AND>" +
                                    "<GT name='EstimatedTimeAtLocation' value='$now' />" +
                                "</OR>" +
                              "<EQ name='AdvertisedTrainIdent' value='" + trainNumber + "' />" +
                            "</AND>" +
                            "</FILTER>" +
                        "</QUERY>" +
                        "</REQUEST>";
    $.ajax({
        type: "POST",
        contentType: "text/xml",
        dataType: "json",
        data: xmlRequest,
        success: function (response) {
            if (response == null) return;
            if (response.RESPONSE.RESULT[0].TrainAnnouncement == null) {
                alert("Tåget hittades inte");
            } else {
              try {
                  renderTrainTable(response.RESPONSE.RESULT[0].TrainAnnouncement);
              }
              catch (ex) { }
            }
        }
    });
}

function SetDifferentTimes(item, lastTrainInfo, hours, minutes11) {
  if (typeof(item.TimeAtLocation) != "undefined") {
    var timeAtLocation = new Date(item.TimeAtLocation);
    var hours2 = timeAtLocation.getHours();
    var minutes2 = timeAtLocation.getMinutes();
    var minutes22 = timeAtLocation.getMinutes();
    if (minutes2 < 10) minutes2 = "0" + minutes2;
    
    if ((hours2 > hours) || (hours2 == hours && minutes22 > minutes11)) {
      if (item.ActivityType == "Ankomst") {
        lastTrainInfo.AnkomstTime2 = hours2 + ":" + minutes2;
      } else {
        lastTrainInfo.AvgangTime2 = hours2 + ":" + minutes2;
      }
    } else {
      if ((hours2 < hours) || (hours2 == hours && minutes22 < minutes11)) {
        if (item.ActivityType == "Ankomst") {
          lastTrainInfo.AnkomstTime3 = hours2 + ":" + minutes2;
        } else {
          lastTrainInfo.AvgangTime3 = hours2 + ":" + minutes2;
        }
      } else {
        if (item.ActivityType == "Ankomst") {
          lastTrainInfo.AnkomstTime4 = hours2 + ":" + minutes2;
        } else {
          lastTrainInfo.AvgangTime4 = hours2 + ":" + minutes2;
        }
      }
    }
  }
  return lastTrainInfo;
}

function renderTrainTable(announcement) {
    var trainInfo = [];
    var lastTrainInfo =  {};
    var stationSigns = [];
    
    $(announcement).each(function (iterator, item) {
        try {
          
          var advertisedtime = new Date(item.AdvertisedTimeAtLocation);
          var hours = advertisedtime.getHours();
          var minutes = advertisedtime.getMinutes();
          var minutes11 = advertisedtime.getMinutes();
          if (minutes < 10) minutes = "0" + minutes;

          var owner = "";
          if (item.InformationOwner != null) owner = item.InformationOwner;
          
          if (lastTrainInfo.LocationSignature == item.LocationSignature) {
            if (item.ActivityType == "Ankomst") {
              lastTrainInfo.AnkomstTime = hours + ":" + minutes;
            } else {
              lastTrainInfo.AvgangTime = hours + ":" + minutes;
            }
            
            lastTrainInfo = SetDifferentTimes(item, lastTrainInfo, hours, minutes11);
          } else {
            if (typeof(lastTrainInfo) != "undefined" && typeof(lastTrainInfo.LocationSignature) != "undefined") {
              trainInfo.push(lastTrainInfo);
            }
            
            var infoList = new Array();
            
            $(item.Booking).each(function (iterator, value) {
                infoList.push(value);
            });
            
            $(item.OtherInformation).each(function (iterator, value) {
                if (value != "Trevlig resa önskar SJ!" && value != "Trevlig resa önskar SJ !") {
                  infoList.push(value);
                }
            });
            stationSigns.push(item.LocationSignature);
            
            lastTrainInfo = {
              LocationSignature : item.LocationSignature,
              LocationName : getStationNameBySign(item.LocationSignature),
              Owner : owner,
              TrackAtLocation : item.TrackAtLocation,
              AdvertisedTrainIdent : item.AdvertisedTrainIdent,
              InfoList : infoList
            };
            
            if (item.ActivityType == "Ankomst") {
              lastTrainInfo.AnkomstTime = hours + ":" + minutes;
              lastTrainInfo.AvgangTime = "-";
            } else {
              lastTrainInfo.AvgangTime = hours + ":" + minutes;
              lastTrainInfo.AnkomstTime = "-";
            }
            
            lastTrainInfo = SetDifferentTimes(item, lastTrainInfo, hours, minutes11);
          }
        }
        catch (ex) { 
          console.log('item', item);
          console.log('renderTrainTable > Exception', ex);
        }
    });
    
    if (typeof(lastTrainInfo) != "undefined" && typeof(lastTrainInfo.LocationSignature) != "undefined") {
      trainInfo.push(lastTrainInfo);
    }
    
    var trainNumber = getParameterByName('train');
    
    var htmlResult = '';
    
    htmlResult = htmlResult + "<li data-role=\"list-divider\">Tåg " + trainNumber + "</li>";
    
    
    $(trainInfo).each(function (iterator, item) {
        try {
          var listViewItemClass = "";
          var ankomstTime = item.AnkomstTime;
          
          if (typeof(item.AnkomstTime2) != "undefined") {
            listViewItemClass = " class=\"redHero\"";
            ankomstTime = item.AnkomstTime2;
          } else {
            if (typeof(item.AnkomstTime3) != "undefined") {
              listViewItemClass = " class=\"greenHero\"";
              ankomstTime = item.AnkomstTime3;
            } else {
              if (typeof(item.AnkomstTime4) != "undefined") {
                listViewItemClass = " class=\"greenHero\"";
                ankomstTime = item.AnkomstTime4;
              }
            }
          }
          
          var avgangTime = item.AvgangTime;
          
          if (typeof(item.AvgangTime2) != "undefined") {
            listViewItemClass = " class=\"redHero\"";
            avgangTime = item.AvgangTime2;
          } else {
            if (typeof(item.AvgangTime3) != "undefined") {
              if (listViewItemClass == "") {
                listViewItemClass = " class=\"greenHero\"";
              }
              avgangTime = item.AvgangTime3;
            } else {
              if (typeof(item.AvgangTime4) != "undefined") {
                if (listViewItemClass == "") {
                  listViewItemClass = " class=\"greenHero\"";
                }
                avgangTime = item.AvgangTime4;
              }
            }
          }
          
          
          htmlResult = htmlResult + "<li" + listViewItemClass + " data-iconpos=\"right\" data-shadow=\"false\" data-corners=\"false\">" +
              "<a href='station.html?sign=" + item.LocationSignature + "' rel=\"external\">" + 
              "<h2>" + item.LocationName + "</h2>" + 
              "<p>" +
                "Spårnummer: " + item.TrackAtLocation; // + " - " + item.Owner;
          
          if (item.InfoList.length > 0) {
            htmlResult = htmlResult + '<br />' + item.InfoList.join('<br />');
          }
          
          if (ankomstTime != item.AnkomstTime && item.AnkomstTime != "-") {
            htmlResult = htmlResult + "<br /><i>Ordinarie ankomsttid: " + item.AnkomstTime + "</i>";
          }
          
          if (avgangTime != item.AvgangTime && item.AvgangTime != "-") {
            htmlResult = htmlResult + "<br /><i>Ordinarie avgångstid: " + item.AvgangTime + "</i>";
          }
          
          htmlResult = htmlResult + "</p>" +
              "<p class=\"ui-li-aside\">" + ankomstTime + "<br />" + avgangTime + "</p>" + 
            "</a></li>";
        }
        catch (ex) { 
          console.log('item', item);
          console.log('renderTrainTable > Exception', ex);
        }
    });

    $('#trainInfoList').html(htmlResult);
    
    $('#trainInfoList').listview('refresh');
    
    $.mobile.loading("hide");
}