$(document).on( "pageinit", "#stationPage", function() {
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
        var fromSign = getParameterByName('from');
        var toSign = getParameterByName('to');

        GetStationInfo(fromSign, toSign);
        
        $(window).scrollTop(0);
        
        $.mobile.loading("hide");
    });
});

function UpdateStationInfo() {
    $.mobile.loading("show");
    
    var fromSign = getParameterByName('from');
    var toSign = getParameterByName('to');

    GetStationInfo(fromSign, toSign);
    
    $(window).scrollTop(0);
    
    $.mobile.loading("hide");
}


function GetStationInfo(fromSign, toSign) {
    
    // Try to get station messages
    GetTrainMessage(fromSign);
    
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
                                                    "value='$dateadd(-00:15:00)' />" +
                                        "<LT name='AdvertisedTimeAtLocation' " +
                                                    "value='$dateadd(14:00:00)' />" +
                                    "</AND>" +
                                    "<GT name='EstimatedTimeAtLocation' value='$now' />" +
                                "</OR>" +
                                "<EQ name='LocationSignature' value='" + fromSign + "' />" +
                                "<EQ name='ToLocation' value='" + toSign + "' />" +
                                "<EQ name='ActivityType' value='Avgang' />" +
                            "</AND>" +
                            "</FILTER>" +
                            // Just include wanted fields to reduce response size.
                            /*"<INCLUDE>InformationOwner</INCLUDE>" +
                            "<INCLUDE>AdvertisedTimeAtLocation</INCLUDE>" +
                            "<INCLUDE>TrackAtLocation</INCLUDE>" +
                            "<INCLUDE>FromLocation</INCLUDE>" +
                            "<INCLUDE>ToLocation</INCLUDE>" +
                            "<INCLUDE>AdvertisedTrainIdent</INCLUDE>" +*/
                        "</QUERY>" +
                        "</REQUEST>";
    $.ajax({
        type: "POST",
        contentType: "text/xml",
        dataType: "json",
        data: xmlRequest,
        success: function (response) {
            if (response == null) {
              return;
            }
            
            if (response.RESPONSE.RESULT[0].TrainAnnouncement == null) {
                $('#stationInfoList').html('<li>Inga avgångar hittades</li>');
                $('#stationInfoList').listview('refresh') ;
            } else {
              try {
                  renderTrainAnnouncement(response.RESPONSE.RESULT[0].TrainAnnouncement);
              }
              catch (ex) { 
                console.log('Exception', ex);
              }
            }
        }
    });
}

function renderTrainAnnouncement(announcement) {
    var fromSign = getParameterByName('from');
    var toSign = getParameterByName('to');
    
    var htmlResult = '';

    htmlResult = htmlResult + "<li data-role=\"list-divider\">" + getStationNameBySign(fromSign) + " till " + getStationNameBySign(toSign) + "</li>";
    
    
    
    $(announcement).each(function (iterator, item) {
        var advertisedtime = new Date(item.AdvertisedTimeAtLocation);
        var hours = advertisedtime.getHours()
        var minutes = advertisedtime.getMinutes()
        var minutes11 = advertisedtime.getMinutes()
        if (minutes < 10) minutes = "0" + minutes
        var toList = new Array();
        $(item.ToLocation).each(function (iterator, toItem) {
            toList.push(getStationNameBySign(toItem));
        });
        
        var owner = "";
        if (item.ProductInformation != null) owner = item.ProductInformation[0];
        
        var typeOfTraffic = "";
        if (item.TypeOfTraffic != null) owner = item.TypeOfTraffic;
        
        var listViewItemClass = "";
        
        if (typeof(item.TimeAtLocation) != "undefined") {
          var timeAtLocation = new Date(item.TimeAtLocation);
          var hours2 = timeAtLocation.getHours();
          var minutes2 = timeAtLocation.getMinutes();
          var minutes22 = timeAtLocation.getMinutes();
          if (minutes2 < 10) minutes2 = "0" + minutes2;

          if ((hours2 > hours) || (hours2 == hours && minutes22 > minutes11)) {
              listViewItemClass = " class=\"redHero\"";
          } else {
            if ((hours2 < hours) || (hours2 == hours && minutes22 < minutes11)) {
              listViewItemClass = " class=\"greenHero\"";
            } else {
              listViewItemClass = " class=\"greenHero\"";
            }
          }
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
        
        htmlResult = htmlResult + "<li" + listViewItemClass + " data-iconpos=\"right\" data-shadow=\"false\" data-corners=\"false\">" + 
            "<a href='train.html?train=" + item.AdvertisedTrainIdent + "' rel=\"external\">" + 
            "<h2>" + hours + ":" + minutes + " " + toList.join(', ') + "</h2>" + 
            "<p>" + 
              "Spår " + item.TrackAtLocation + " - " + owner + " - " + typeOfTraffic + " " + item.AdvertisedTrainIdent + 
              (infoList.length > 0 ? '<br />' + infoList.join('<br />') : '') + 
            "</p>" + 
          "</a></li>";
    });
    
    $('#stationInfoList').html(htmlResult);
    // $('#stationInfoMainDiv').show();
    $('#stationInfoList').listview('refresh') ;

    $.mobile.loading("hide");
}

function GetTrainMessage(sign) {
    // Request to load announcements for a station by its signature
    var xmlRequest = "<REQUEST version='1.0'>" +
                        "<LOGIN authenticationkey='" + TSS.TrafikverketKey + "' />" +
                        "<QUERY objecttype='TrainMessage' " +
                            "orderby='ModifiedTime' >" +
                            "<FILTER>" +
                                "<EQ name='AffectedLocation' value='" + sign + "' />" +
                            "</FILTER>" +
                            "<INCLUDE>StartDateTime</INCLUDE>" +
                            "<INCLUDE>LastUpdateDateTime</INCLUDE>" +
                            "<INCLUDE>ExternalDescription</INCLUDE>" +
                            "<INCLUDE>ReasonCodeText</INCLUDE>" +
                        "</QUERY>" +
                        "</REQUEST>";
    $.ajax({
        type: "POST",
        contentType: "text/xml",
        dataType: "json",
        data: xmlRequest,
        success: function (response) {
            if (response == null) {
              return;
            }
            
            if (response.RESPONSE.RESULT[0].TrainMessage == null) {
              // Do nothing
            } else {
              try {
                  renderTrainMessage(response.RESPONSE.RESULT[0].TrainMessage);
              }
              catch (ex) { 
                console.log('Exception', ex);
              }
            }
        }
    });
}

function renderTrainMessage(announcement) {

    var htmlResult = '<a href="#popupBasic" id="popupBasicLink" data-rel="popup" class="ui-btn ui-corner-all ui-shadow ui-icon-info ui-btn-icon-left" data-transition="pop">Trafikmeddelanden</a>';

    htmlResult = htmlResult + '<div data-role="popup" id="popupBasic">';
    
    
    $(announcement).each(function (iterator, item) {
        var startDateTime = new Date(item.StartDateTime);
        var hours = startDateTime.getHours();
        var minutes = startDateTime.getMinutes();
        if (minutes < 10) minutes = "0" + minutes;
        
        var month = startDateTime.getMonth()+1;
        var day = startDateTime.getDate();

        var outputDate = startDateTime.getFullYear() + '-' +
            (month<10 ? '0' : '') + month + '-' +
            (day<10 ? '0' : '') + day;
        
        var lastUpdateDateTime = new Date(item.LastUpdateDateTime);
        var hours2 = lastUpdateDateTime.getHours();
        var minutes2 = lastUpdateDateTime.getMinutes();
        if (minutes2 < 10) minutes2 = "0" + minutes2;
        
        var month2 = lastUpdateDateTime.getMonth()+1;
        var day2 = lastUpdateDateTime.getDate();

        var outputDate2 = lastUpdateDateTime.getFullYear() + '-' +
            (month2<10 ? '0' : '') + month2 + '-' +
            (day2<10 ? '0' : '') + day2;
            
        var externalDescription = item.ExternalDescription;
        var reasonCodeText = item.ReasonCodeText;
        var countyNo = item.CountyNo;
        
        htmlResult = htmlResult + '<p>Starttid: ' + outputDate + ' ' + hours + ':' + minutes + 
            ' - Uppdaterad: ' + outputDate2 + ' ' + hours2 + ':' + minutes2 + 
            '<br />' + externalDescription + '</p>';
    });
    
    htmlResult = htmlResult + '</div>';
    
    $('#staionInfoMessageDiv').html(htmlResult);
    
    $('#popupBasic').popup();
}
