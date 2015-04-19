function save() {
    localStorage.setItem("save", JSON.stringify(gD));
    var str = (gD.options.autoSave ? "Auto" : "Manual");
    log("Game saved");
    if(typeof _gaq !== 'undefined') { // Prevent logger failure
        _gaq.push(['_trackEvent', 'Fire Watcher', 'Save']);
    }
}

function load() { //TODO : Check compatibility on version upgrade
    game.onLoad = true; // Restore actions on next tick
    var saveTheme = gD.options.darkTheme;
    for (var i in gD.actions) {
        if (gD.actions[i].unlocked) {
            buyUpgrade(i, true); // Delete everything
        }
    }
    $("#upgradesBought").html("");
    if (game.onReset) {
        gD = JSON.parse(localStorage.getItem("initValues"));
        gD.currentTab = "opt"; // Needed to change tab
        changeTab("play");
        log("Game resetted!");
    } else if (game.onImport) {
        loadRec(game.newSave, gD);
        gD.currentTab = "opt";
        changeTab("play");
        log("Succesfully imported savefile.")
    } else {
        loadRec(JSON.parse(localStorage.getItem("save")), gD);
        if (localStorage.getItem("save") != localStorage.getItem("initValues")) {
            clearLogs();
            log("Game loaded.");
        }
    }
    game.onUpdate = true;
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
    gD.actions.totalActions = 0; // Computed at next nick
    $("#updateAnnouncementClose").click(function() {
        gD.announcements.update.dismissed = true;
        $("#updateAnnouncement").css("display", "none");
    });
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
        $("#importError").css("display", "block"); // Error message
        return false;
    }
    return true;
}

function importSave() {
    $("#containerImport").focus();
    if (importSaveRec()) {
        game.onReset = true; // Set minimal values
        load();
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
        game.logTimeout.l1 = setTimeout(unhighlightLastLog, gD.options.logDuration); //TODO : Transition, bitstorm?
    }
    $("#fullLogs").html($("#fullLogs").html() + date + str + "\n");
    game.latestFullLog++;
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

