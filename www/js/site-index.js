
$(document).on( "pageinit", "#indexPage", function() {
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
      LoadHistoryStationList();
      $.mobile.loading("hide");
    });
    
    $( "#autocomplete" ).on( "filterablebeforefilter", function ( e, data ) {
        var $ul = $( this ),
            $input = $( data.input ),
            value = $input.val(),
            html = "";
        $ul.html( "" );
        if ( value && value.length > 2 ) {
            $ul.html( "<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>" );
            $ul.listview( "refresh" );
            
            var matches = $.map(TSS.StationList, function (tag) {
                if (tag.label.toUpperCase().indexOf(value.toUpperCase()) === 0) {
                    return {
                        label: tag.label,
                        value: tag.value
                    }
                }
            });
            
            $.each( matches, function ( i, val ) {
                html += "<li><a href=\"JavaScript:AddHistoryStation('" + val.value + "', 'station.html?sign=" + val.value + "');\" rel=\"external\">" + val.label + "</a></li>";
            });
            $ul.html( html );
            $ul.listview( "refresh" );
            $ul.trigger( "updatelayout");
        }
    });
});


function LoadHistoryStationList() {
  var _historyStationList = $.jStorage.get("HistoryStationList");
  if (_historyStationList) {
    TSS.HistoryStationList = _historyStationList;
  }
  
  var html = "";
  
  if (TSS.HistoryStationList.length === 0) {
    html += "<li>Inga tidigare valda stationer hittades...</li>";
  } else {
    $.each(TSS.HistoryStationList, function (i, val) {
        html += "<li><a href=\"station.html?sign=" + val + "\" rel=\"external\">" + getStationNameBySign(val) + "</a></li>";
    });
  }
  
  $('#historyStationList').html(html);
  $('#historyStationList').listview("refresh");
  $('#historyStationList').trigger("updatelayout");
}

function AddHistoryStation(sign, url) {
  var _historyStationList = $.jStorage.get("HistoryStationList");
  if (_historyStationList) {
    TSS.HistoryStationList = _historyStationList;
  }
  
  TSS.HistoryStationList.push(sign);
  
  $.jStorage.set('HistoryStationList', TSS.HistoryStationList);
  
  document.location = url;
}

function RemoveFavoriteStation(sign) {
  var _historyStationList = $.jStorage.get("HistoryStationList");
  if (_historyStationList) {
    TSS.HistoryStationList = _historyStationList;
    
    TSS.HistoryStationList = jQuery.grep(TSS.HistoryStationList, function(value) {
      return value != sign;
    });
    
    $.jStorage.set('HistoryStationList', TSS.HistoryStationList);
  }
}