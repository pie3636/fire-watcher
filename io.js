function save() {
    localStorage.setItem("save", JSON.stringify(gD));
    var str = (gD.options.autoSave ? "Auto" : "Manual");
    if (!game.latestLogSave) {
        log("Game saved");
        game.latestLogSave = 2;
    } else if (game.latestLogSave == 1) {
        $("#l1").html($("#l1").html().replace(/\(x\d*\)/, function(n) {return "(x" + (Number(n.slice(2).slice(0, -1)) + 1) + ")"}));
    } else {
        $("#l1").html($("#l1").html().replace(/$/, " (x2)"));
        game.latestLogSave = 1;
    }
    if(typeof _gaq !== 'undefined') { // Prevent logger failure
        _gaq.push(['_trackEvent', 'Fire Watcher', 'Save']);
    }
}

function reload() {
    game.onReload = true;
    load();
}

function load(hide) {
    game.onLoad = true; // Restore actions on next tick
    if (!game.onReload) {
        gD.stats.sessionTime = 0;
    }
    var saveTheme = gD.options.darkTheme;
    unsetUseLinks("branches"); //TODO : Loop
    unsetUseLinks("shells");
    unsetUseLinks("planks");
    $("#actions").html("<div style='margin-left:15px'>Time left : <span id='time'>0</span><br /><br /></div><hr/>");
    $("#upgrades").html("<!--<p class='text-center'>--><p>Upgrades :</p>");
    $("#upgradesBought").html("");
    $("#extensionsBought").html("");
    $("#achievements").html("");
    if (game.onReset) {
        gD = JSON.parse(localStorage.getItem("initValues"));
        gD.currentTab = "opt"; // Needed to change tab
        changeTab("play");
        if (!hide) {
            log("Game resetted!");
        }
    } else if (game.onImport) {
        loadRec(game.newSave, gD);
        gD.currentTab = "opt";
        changeTab("play");
        log("Succesfully imported savefile.")
    } else if (game.onReload) {
    } else {
        loadRec(JSON.parse(localStorage.getItem("save")), gD);
        gD.currentTab = "opt";
        if (localStorage.getItem("save") != localStorage.getItem("initValues")) {
            clearLogs();
            clearFullLogs();
            log("Game loaded");
        }
    }
    game.onReset = false;
    game.onImport = false;
    if (saveTheme != gD.options.darkTheme) {
        $("#darkTheme").prop("checked", !saveTheme);
        gD.options.darkTheme = saveTheme;
        setTheme(); // Changes theme from gD.options.saveTheme to its opposite
    }
    $("#updateAnnouncement").css("display", (gD.announcements.update.version == game.version && gD.announcements.update.dismissed ? "none" : "block"));
    if (gD.announcements.update.version != game.version) {
        gD.announcements.update.dismissed = false;
    }
    gD.announcements.update.version = game.version;
    gD.stats.totalActions = 0; // Computed at next nick
    gD.stats.totalUpgrades = 0;
    gD.stats.totalAchievements = 0;
    gD.stats.totalExtensions = 0;
    $("#updateAnnouncementClose").click(function() {
        gD.announcements.update.dismissed = true;
        $("#updateAnnouncement").hide();
    });
    for (var i in gD.inventory) {
        if (gD.inventory[i].unlocked) {
            $("#inv_" + i).show();
            $("#inv_" + i + "_info").tooltip().hover(themeTooltip);
        } else {
            $("#inv_" + i).hide();
        }
    }
    $("#timeFormatting").val(String(gD.options.formatting.time));
    $("#resourcesFormatting").val(String(gD.options.formatting.resources))
}

function loadRec(save, data) {
    for (var i in save) {
        switch (typeof save[i]) {
            case "number":
            case "boolean":
            case "string":
                data[i] = save[i];
                break;
            case "object":
                if (typeof data[i] !== 'undefined') {
                    loadRec(save[i], data[i]);
                }
                break;
            case "undefined":
            default:
                break;
        }
    }
}

function autoSave() {
    if (gD.options.autoSave.enabled) {
        clearInterval(gD.options.autoSave.enabled);
        gD.options.autoSave.enabled = 0;
    } else {
        gD.options.autoSave.enabled = setInterval(save, gD.options.autoSave.interval);
    }
}

function autoSaveTimer() {
    var interval = Number($("#autoSaveTimer").val());
    if (gD.options.autoSave.enabled && interval >= 10 && interval <= 3600) {
        clearInterval(gD.options.autoSave.enabled);
        gD.options.autoSave.enabled = setInterval(save, interval*1000);
        gD.options.autoSave.interval = interval*1000;
    }
}

function wipe() {
    game.onReset = true;
    load();
}

function exportSave() {
    $("#containerExport").html(Base64.encode(JSON.stringify(gD)));
    $("#containerExport").focus();
}

function importSaveRec() {
    try {
        game.newSave = JSON.parse(Base64.decode($('#containerImport').val()));
        $('#importGame').modal('hide'); // Doesn't happen if error
    }
    catch(err) {
        $("#importError").show(); // Error message
        return false;
    }
    $('#containerImport').val("");
    return true;
}

function importSave() {
    $("#containerImport").focus();
    if (importSaveRec()) {
        game.onReset = true; // Set minimal values
        load(true);
        game.onImport = true;
        load();
    }  
}

/*====================================================================== LOGGER ======================================================================*/

function log(str, secondary) {
    var d = new Date;
    var date = "[" + prettify(d.getHours(), 0, 2) + ":" + prettify(d.getMinutes(), 0, 2) + ":" + prettify(d.getSeconds(), 0, 2) + "." + prettify(d.getMilliseconds(), 0, 3) + "] ";
    if(!secondary) {
        game.latestLog = Math.min(game.numLogs, game.latestLog + 1);
        clearTimeout(game.logTimeout["l" + game.numLogs]);
        for (var i = game.numLogs; i > 1; i--) {
            $("#l" + i).html($("#l" + (i - 1)).html());
            if ($("#l" + (i - 1)).css("font-weight") == "bold") {
                $("#l" + i).css("color", (gD.options.darkTheme ? "#FF0" : "#08F")).css("font-weight", "bold");
                game.logTimeout["l" + i] = game.logTimeout["l" + (i - 1)];
            }
        }
        $("#l1").html("<span style='color:#A00'>" + date + "</span>" + str);
        $("#l1").css("color", (gD.options.darkTheme ? "#FF0" : "#08F")).css("font-weight", "bold");
        game.logTimeout.l1 = setTimeout(unhighlightLastLog, gD.options.logDuration * 1000);
        $("#logger").css("background-color", (gD.options.darkTheme ? "#002" : "#ffd"));
        clearTimeout(game.logTimeout);
        game.logTimeout = setTimeout(function(){$("#logger").css("background-color", (gD.options.darkTheme ? "#111" : "#eee"))}, 250);
    }
   $("#fullLogs").html(date + str + "\n" + $("#fullLogs").html().replace(/<\/i>/, "").replace(/<i>/, ""));
    game.latestFullLog++;
    game.latestLogSave = 0;
    resizeFullLogs();
}

function unhighlightLastLog() {
    $("#l" + game.latestLog).css("color", (gD.options.darkTheme ? "#9d9d9d" : "#555")).css("font-weight", "normal");
    game.logTimeout["l" + game.latestLog] = 0;
    game.latestLog--;
}

function clearLogs() {
    for (var i = 1; i <= game.numLogs; i++) {
        clearTimeout(game.logTimeout["l" + i]);
        game.logTimeout["l" + i] = 0;
        $("#l" + i).html("").css("color", (gD.options.darkTheme ? "#9d9d9d" : "#555")).css("font-weight", "normal");
    }
    game.latestLog = 0;
}

function logDurationSetting() {
    gD.options.logDuration = Number(1000 * $("#logDuration").val());
    for (var i = 1; i <= game.numLogs; i++) {
        clearTimeout(game.logTimeout["l" + i]);
        if ($("#l" + i).css("font-weight") == "bold") {
            game.logTimeout["l" + i] = setTimeout(unhighlightLastLog, gD.options.logDuration.logDuration);
        }
    }
}

/* ====================================================================== FULL LOGS ====================================================================== */

function clearFullLogs() {
    $("#fullLogs").html("");
    game.latestFullLog = 0;
}

function resizeFullLogs() {
    if (game.latestFullLog > gD.options.numFullLogs) {
        $("#fullLogs").html($("#fullLogs").html().split("\n").splice(game.latestFullLog - gD.options.numFullLogs).join("\n")); // Remove first lines
        game.latestFullLog = gD.options.numFullLogs;
        
    }
}

function fullLogSize() {
    gD.options.numFullLogs = $("#fullLogSize").val();
    resizeFullLogs();
}


