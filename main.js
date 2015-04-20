//TODO: More stats (sessionTime, prestigeTime, achievements/upgrades count...), grey, hasOwnProperty -> optimisation, progress (bars?), log highlighting transition? (bitstorm), compatibility on version update, timify, cost, countActions

/*function buyWatcher(number) {
    for (var i = 1; i <= number; i++) {
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

function tick() {
    gD.time -= gD.timeSpeed * gD.tickDuration/1000;
    gD.stats.playTime += gD.tickDuration/1000;
    //time += watchers * watcherPower * tickDuration/1000;
    $("#time").html(timify(gD.time, 3));
    for (var i in actions) {
        var normalTick = !gD.actions[i].unlocked && compare(actions[i].unlock, gD) || gD.actions[i].unlocked && game.onLoad && !gD.actions[i].bought;
        var restoreStats = game.onLoad && gD.actions[i].bought;
        if (normalTick || restoreStats) { // If new action unlocked or unlocked in loaded game or bought in loaded game (to add to stats)
            gD.actions[i].unlocked = true;
            if (actions[i].repeatable && gD.actions[i].unlocked) {
                gD.actions.totalActions++;
            }
            var strButton = '<button id=' + i + ' type="button" class="btn btn-default' + (gD.options.darkTheme ? "2" : "") + '" data-toggle="tooltip" data-placement="bottom" title="' + actions[i].show.tooltip + '" data-container="body">';
            switch (actions[i].show.type) { // Display it
            case "standardAction":
                if (normalTick) {
                    $("#actions").append('\
                        <div id="' + i + 'Div" class="row" style="margin-left:10px">\
                            <div class="col-md-3 col-md-center' + (actions[i].show.nocenter ? ' top3' : '') + '">\
                                ' + strButton + i.textify() + '</button>\
                            </div>\
                            <div class="col-md-9' + (actions[i].show.nocenter ? '' : ' top6') + '">\
                                ' + actions[i].show.inside + '\
                            </div>\
                        </div>\
                        <hr id="' + i + 'HR"' + (gD.options.darkTheme ? 'class="HR2"' : "") + ' />');
                }
                break;
            case "standardUpgrade":
                if (normalTick) {
                    $("#upgrades").append(
                            strButton + i.textify() + ' ' + cost(i) + '</button>');
                    $("#" + i).css("margin-right", 10);
                }
                if (restoreStats) {
                    $("#upgradesBought").append(
                        strButton + i.textify() + ' ' + cost(i) + '</button>');
                        $("#" + i).css("margin-right", 10);
                }
                break;
            case "standardAchievement":
                if (normalTick) {
                    $("#achievements").append(
                            strButton + i.textify() + ' </button>');
                    $("#" + i).css("margin-right", 10);
                    if (typeof actions[i].effect !== 'undefined') {
                        actions[i].effect();
                    }
                    if (!game.onLoad) {
                        log("Achievement unlocked : " + i.textify() + "!");
                    }
                }
                break;
            case "noDisplay":
                buyUpgrade(i);
                break;
            default:
                if (normalTick) {
                    $(actions[i].isUpgrade ? "#upgrades" : "#actions").after(actions[i].show.text);
                }
                break;
            }
            if (actions[i].show.type == "standardAction" || actions[i].show.type == "standardUpgrade" || actions[i].show.type == "standardAchievement") { // Fix to prevent constant focus after clicking
                $("#" + i).tooltip().mouseup(toBlur).hover(themeTooltip); // Changes tooltip theme as needed
                if (normalTick && actions[i].show.type != "standardAchievement") {
                    $("#" + i).on('click', function(_i){
                        return function() { // Clooooooosure :D
                            buyUpgrade(_i);
                        };
                    }(i));
                }
            }
        }
        var greyOut = "greyedOut" + (gD.options.darkTheme ? "2" : "");
        if (!$("#" + i + ":hover").length) {
            if(gD.actions[i].unlocked && !compare(actions[i].cost, gD) && !gD.actions[i].bought) { // Each action unlocked : grey if and only if not affordable and not bought yet
                if (!$("#" + i).hasClass(greyOut)) {
                    $("#" + i).addClass(greyOut);
                }
            } else {
                $("#" + i).removeClass(greyOut);
            }
        } else {
            $("#" + i).removeClass(greyOut);
        }
        if(typeof actions[i].tick !== 'undefined' && (!game.onLoad || gD.actions[i].unlocked)) { // && (!actions[i].tickIfBought || gD.actions[i].bought) && (!actions[i].tickIfUnlocked || gD.actions[i].unlocked)) { // No tick if loading game and not unlocked
            actions[i].tick();
        }
    }
    if (gD.currentTab == "stats") {
        $("#stats_sessionTime").html(timify(gD.stats.playTime, 2));
        $("#stats_fanTheFlamesUses").html(gD.actions.fanTheFlames.uses);
        $("#actionsUnlockedCur").html(gD.actions.totalActions);
    }
    game.onLoad = false;
    /* greyOut("buyWatcher1", time >= sumPrices(10, 1.1, watchers, 1));
    greyOut("buyWatcher2", time >= sumPrices(10, 1.1, watchers, 10));
    greyOut("buyWatcher3", time >= sumPrices(10, 1.1, watchers, 100)); */
}

function buyUpgrade(upgrade) {
    if (!gD.actions[upgrade].bought && compare(actions[upgrade].cost, gD, true)) { // First condition isn't mandatory
        if (typeof actions[upgrade].effect !== 'undefined') {
            actions[upgrade].effect();
        }
        if (!actions[upgrade].repeatable) {
            gD.actions[upgrade].bought = true;
            switch (actions[upgrade].show.type) {
                case "standardAction":
                    $("#" + upgrade).tooltip('hide');
                    $("#" + upgrade + "Div").remove();
                    $("#" + upgrade + "HR").remove();
                    break;
                case "standardUpgrade":
                    $("#upgradesBought").append($("#" + upgrade)[0].outerHTML); //TODO : Add other cases?
                    $("#" + upgrade).tooltip('hide');
                    $("#" + upgrade).remove();
                    $("#" + upgrade).tooltip().mouseup(toBlur).hover(themeTooltip);
                    break;
                case "noDisplay":
                    break;
                case "standardAchievement": // Shouldn't happen
                default:
                    console.log("ERROR");
                    break;
            }
        }
    }
}

function compare(cost, data, doSub, subStep) { // Returns (cost <= data), data -= cost if doSub, subStep means toplevel (nested objects)
    var ret = true;
    if(!subStep) {
        for (var i in cost) {
            switch (typeof cost[i]) {
                case "number":
                    if (typeof data[i] === "number") {
                        ret = cost[i] <= data[i];
                    } else {
                        switch (cost[i].operator) {
                            case game.operator.EQ:
                                ret = cost[i].value == data[i];
                                break;
                            case game.operator.LT:
                                ret = cost[i].value > data[i];
                                break;
                            case game.operator.LE:
                                ret = cost[i].value >= data[i];
                                break;
                            case game.operator.GT:
                                ret = cost[i].value < data[i];
                                break;
                            case game.operator.GE:
                                ret = cost[i].value <= data[i];
                                break;
                            case game.operator.NE:
                                ret = cost[i].value != data[i];
                                break;
                        }
                    }
                    break;
                case "boolean":
                    if (typeof data[i] === "boolean") {
                        ret = cost[i] == data[i];
                    } else {
                        switch (cost[i].operator) {
                            case game.operator.EQ:
                                ret = cost[i].value == data[i];
                                break;
                            case game.operator.NE:
                                ret = cost[i].value != data[i];
                                break;
                        }
                    }
                    ret = cost[i] == data[i];
                    break;
                case "object":
                    ret = compare(cost[i], data[i], false); // doSub == false => compare only
                    break;
                case "undefined":
                default:
                    break;
            }
            if (!ret) return false;
        }
    }
    if (doSub) { // Can only possibly happen at toplevel
        for (var i in cost) {
            switch (typeof cost[i]) {
                case "number":
                    if (typeof data[i] === "number" || cost[i].isConsumed) {
                        data[i] -= cost[i];
                    }
                    break;
                case "object":
                    ret = compare(cost[i], data[i], true, true); // Transmit doSub, skip first step
                case "boolean":
                    if (typeof data[i] === "object" || cost[i].isConsumed) {
                        data[i] = !data[i];
                    }
                case "undefined":
                default:
                    break;
            }
        }
    }
    return true;
}

function changeTab(newTab) {
    $("#nav_" + gD.currentTab).parent().removeClass("active");
    $("#nav_" + newTab).parent().addClass("active");
    hide(gD.currentTab);
    show(newTab);
    gD.currentTab = newTab;
}

function setTheme() {
    if (gD.options.darkTheme) {
        $("#navbar, #logger").removeClass("navbar-inverse");
        $(".btn-default2").not(document.getElementById("importNow")).removeClass("btn-default2").addClass("btn-default");
        $(".split-left2").removeClass("split-left2").addClass("split-left");
        $("hr").removeClass("HR2");
        $(".btn").removeClass("greyedOut2");
    } else {
        $("#navbar, #logger").addClass("navbar-inverse");
        $(".btn-default").not(document.getElementById("importNow")).removeClass("btn-default").addClass("btn-default2");
        $(".split-left").removeClass("split-left").addClass("split-left2");;
        $("hr").addClass("HR2");
        $(".btn").removeClass("greyedOut");
    }
    $(".navbar-fixed-bottom").css("color", (gD.options.darkTheme ? "#777" : "9d9d9d")).css("text-shadow", (gD.options.darkTheme ? "0 1px 0 rgba(255, 255, 255, .25)" : "0 -1px 0 rgba(0, 0, 0, .25)"));
    $("#logger").css("background-color", (gD.options.darkTheme ? "#eee" : "#111"));
    $("#fullLogs").css("background-color", (gD.options.darkTheme ? "#eee" : "#111")).css("color", (gD.options.darkTheme ? "#555" : "#9d9d9d"));
    $("body").css("background-color", (gD.options.darkTheme ? "#FFF" : "#000")).css("color", (gD.options.darkTheme ? "#000" : "#FFF"));
    for (var i = 1; i <= game.numLogs; i++) {
        if ($("#l" + i).css("font-weight") == "bold") {
            $("#l" + i).css("color", (gD.options.darkTheme ? "#08F" : "#FF0"));
        }
    }
    gD.options.darkTheme = !gD.options.darkTheme;
}

$(function () {
    for (var i in actions) {
        if (gD.actions.hasOwnProperty(i)) {
            gD.actions[i].unlocked = false;
            gD.actions[i].bought = false;
        } else {
            gD.actions[i] = {unlocked: false, bought: false};
        }
    }
    localStorage.setItem("initValues", JSON.stringify(gD));
    for(var i = 1; i <= game.numLogs; i++) {
        $("#l" + i).css("color", (gD.options.darkTheme ? "#FF0" : "#08F")).css("font-weight", "bold");
        game.logTimeout["l" + i] = setTimeout(unhighlightLastLog, 10000 + 1000 * i);
    }
    load();
    gD.currentTab = "play";
    $("#version").append(game.version);
    $("#updateAnnouncementVersion").html(game.version);
    $("#darkTheme").change(setTheme).prop("checked", gD.options.darkTheme);
    if (gD.options.darkTheme) {
        gD.options.darkTheme = false;
        setTheme();
    }
    $("#autoSave").change(autoSave).prop("checked", gD.options.autoSave.enabled != 0);
    $("#autoSaveTimer").keydown(validateNumber(autoSaveTimer)).change(autoSaveTimer);
    $("#logDuration").keydown(validateNumber(logDurationSetting)).change(logDurationSetting);
    $("#fullLogSize").keydown(validateNumber(fullLogSize)).change(fullLogSize);
    $("#saveSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(save);
    $("#loadSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(load);
    $("#deleteSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(function() {
        localStorage.setItem("save", JSON.stringify(JSON.parse(localStorage.getItem("initValues"))));
        log("Savefile successfully deleted.");
    });
    $("#wipeSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(wipe);
    $("#exportSave").tooltip().mouseup(toBlur).hover(themeTooltip).click(exportSave).attr("data-toggle", "modal").attr("data-target","#exportGame").focus(toBlur);
    $("#importSave").tooltip().mouseup(toBlur).hover(themeTooltip).attr("data-toggle", "modal").attr("data-target","#importGame").focus(toBlur); // Or it stays focused after the modal is closed
    $("#importNow").tooltip().mouseup(toBlur).click(importSave);
    $("#clearLogs").tooltip().mouseup(toBlur).click(clearLogs);
    $("#clearFullLogs").tooltip().mouseup(toBlur).click(clearFullLogs);
    $("#actionsUnlockedTotal").html(countActions());
    $('.modal').on('show.bs.modal', centerModal);
    $(window).on("resize", function() {
        $('.modal:visible').each(centerModal);
    });
    $('#exportGame').on('shown.bs.modal', function() { // Select and focus text
        $('#containerExport').focus().select();
    });
    $('#importGame').on('hidden.bs.modal', function() {
        $("#importError").css("display", "none");
    });
    $('#importGame').on('shown.bs.modal', function() {
        $('#containerImport').focus();
    });
});

window.setInterval(tick, gD.tickDuration);
