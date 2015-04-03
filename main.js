var tickDuration = 100;
var time = 60;
var timeSpeed = 1;
var firePower = 5;
var unlock = {
    brushwood : false
};
var brushwoodFatigue = 0;
//var watchers = 0;
//var watcherPower = 1;
//var firstUpgrade = false;

function fireClick() {
    time += firePower;
}

function sumPrices(base, factor, owned, number) {
    var sum = 0;
    for (i = owned + 1; i <= owned + number; i++) {
        sum += Math.floor(base * Math.pow(factor, i));
    }
    return sum;
}

function fetchBrushwood() {
    var cost = 60 + brushwoodFatigue;
    if (time >= cost) {
        brushwoodFatigue += 30;
        time += 300 - brushwoodFatigue - cost;
    }
}

/*function buyWatcher(number) {
    for (i = 1; i <= number; i++) {
        var watcherCost = sumPrices(10, 1.1, watchers, 1);
        if(time >= watcherCost) {
            watchers++;
            time -= watcherCost;
            var nextCost = sumPrices(10, 1.1, watchers, 1);
                $("#watchers").html(watchers);
                $("#watcherCost").html(nextCost);
                $("#watcherProduction").html(watcherPower * watchers);
                tooltip(buyWatcher1, "Cost : " + nextCost); //TODO : EDIT
        }
    }
}*/

/*function buyFirstUpgrade(price) {
    if(time >= price) {
        watcherPower *= 10;;
        time -= price;
        hide("1stup");
        firstUpgrade = true;
        $("#watcherProduction").html(watcherPower * watchers);
    }
}*/

function tick(timeSpeed) {
    time -= timeSpeed * tickDuration/1000;
    if (brushwoodFatigue) brushwoodFatigue -= tickDuration/1000;
    $("#fetchBrushwoodLoss").html(60 + brushwoodFatigue + " seconds");
    $("#fetchBrushwoodGain").html(300 - brushwoodFatigue + " more seconds"); //TODO : EDIT
    //time += watchers * watcherPower * tickDuration/1000;
    $("#time").html(prettify(time, 3));
    if (time >= 100 && !unlock.brushwood) {show("fetchBrushwood"); show("fetchBrushwoodHR")};
    /*if (time >= 100 && !firstUpgrade) {
        show("1stup");
    }
    greyOut("buyWatcher1", time >= sumPrices(10, 1.1, watchers, 1));
    greyOut("buyWatcher2", time >= sumPrices(10, 1.1, watchers, 10));
    greyOut("buyWatcher3", time >= sumPrices(10, 1.1, watchers, 100));
    greyOut("1stup", time >= 250);*/
}

function prettify(input, digits) {
    var dotAdded = false;
    digits = (typeof digits === 'undefined' ? 9 : digits);
	return input.toFixed(digits);
}

function timify(input, digits) {
    // TODO : Fill this
}

function show(id) {
    $("#" + id).css("display", "block");
}

function hide(id) {
    $("#" + id).css("display", "none");
}

function greyOut(id, back) {
    $("#" + id).css("background-color", (back ? "#fff" : "#eee"));
}

function tooltip(id, title, show) {
    show = (typeof show === 'undefined' ? true : show);
    $("#" + id).attr("title", title).tooltip('fixTitle');
    if (show) $("#" + id).tooltip('show');
}

window.setInterval(function(){
    tick(timeSpeed);
}, tickDuration);

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});
