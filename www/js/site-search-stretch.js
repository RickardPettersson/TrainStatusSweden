
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
      LoadHistoryStretchList();
      $.mobile.loading("hide");
    });
    
    $("#fromStation").on("filterablebeforefilter", function (e, data) {
        var $ul = $(this),
            $input = $(data.input),
            value = $input.val(),
            html = "";
        $ul.html( "" );
        if (value && value.length > 2) {
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
            
            $.each(matches, function (i, val) {
                html += "<li><a href=\"JavaScript:AddFromStation('" + val.value + "', '" + val.label + "');\">" + val.label + "</a></li>";
            });
            $ul.html(html);
            $ul.listview("refresh");
            $ul.trigger("updatelayout");
        }
    });
    
    $("#toStation").on("filterablebeforefilter", function (e, data) {
        var $ul = $(this),
            $input = $(data.input),
            value = $input.val(),
            html = "";
        $ul.html( "" );
        if (value && value.length > 2) {
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
            
            $.each(matches, function (i, val) {
                html += "<li><a href=\"JavaScript:AddToStation('" + val.value + "', '" + val.label + "');\">" + val.label + "</a></li>";
            });
            $ul.html(html);
            $ul.listview("refresh");
            $ul.trigger("updatelayout");
        }
    });
});

function AddFromStation(sign, name) {
  var input = $('#fromStation').closest('[data-role=listview]').prev('form').find('input');
  input.val(name);
  
  input.attr('sign', sign);
  
  $('#fromStation').closest('[data-role=listview]').children().empty();
}

function AddToStation(sign, name) {
  var input = $('#toStation').closest('[data-role=listview]').prev('form').find('input');
  input.val(name);
  
  input.attr('sign', sign);
  
  $('#toStation').closest('[data-role=listview]').children().empty();
}

function LoadHistoryStretchList() {
  TSS.HistoryStretchList = [];
  
  var _historyStretchList = $.jStorage.get("HistoryStretchList");
  if (_historyStretchList) {
    TSS.HistoryStretchList = _historyStretchList;
  }
  
  var html = "";
  
  if (TSS.HistoryStretchList.length === 0) {
    html += "<li>Inga tidigare valda sträckor hittades...</li>";
  } else {
    $.each(TSS.HistoryStretchList, function (i, val) {
        console.log(val.from, val.to);
        html += "<li><a href=\"stretch.html?from=" + val.from + "&to=" + val.to + "\" rel=\"external\">" + getStationNameBySign(val.from) + " till " + getStationNameBySign(val.to) + "</a></li>";
    });
  }
  
  $('#HistoryStretchList').html(html);
  $('#HistoryStretchList').listview("refresh");
  $('#HistoryStretchList').trigger("updatelayout");
}

function AddHistoryStretch() {
  var _historyStretchList = $.jStorage.get("HistoryStretchList");
  if (_historyStretchList) {
    TSS.HistoryStretchList = _historyStretchList;
  }
  
  var fromStationInput =  $('#fromStation').closest('[data-role=listview]').prev('form').find('input');
  var toStationInput = $('#toStation').closest('[data-role=listview]').prev('form').find('input');
  
  if (fromStationInput.attr('sign').length > 0 && toStationInput.attr('sign').length > 0) {
    
    TSS.HistoryStretchList.push({ "from": fromStationInput.attr('sign'), "to": toStationInput.attr('sign') });
    
    $.jStorage.set('HistoryStretchList', TSS.HistoryStretchList);
    
    LoadHistoryStretchList();
    
    fromStationInput.val('');
    toStationInput.val('');
  }
}

function RemoveFavoriteStation(sign) {
  var _historyStationList = $.jStorage.get("HistoryStationList");
  if (_historyStationList) {
    TSS.HistoryStationList = _historyStationList;
    
    TSS.HistoryStationList = jQuery.grep(TSS.HistoryStationList, function(item) {
      return item.from != from && item.to != to;
    });
    
    $.jStorage.set('HistoryStationList', TSS.HistoryStationList);
  }
}