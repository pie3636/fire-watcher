var game = {
    version: "v0.6.0",
    onLoad: false, // Restore purchases
    onImport: false, // Load from import
    onReset: false, // Load from initValues
    logTimeout: {},
    latestLog: 5,
    numLogs: 5,
    sessionTime: 0,
    latestFullLog: 0,
    newSave: {},
    operator: {
        EQ: 1, // =
        LT: 2, // <
        LE: 3, // <=
        GT: 4, // >
        GE: 5, // >=
        NE: 6  // !=
    },
    inventory: {
        branches: {
            buy: function(str) { // TODO : Generalize function
                var n = (str == "all" ? gD.inventory.branches.value : str);
                if (n <= gD.inventory.branches.value && n) {
                    gD.inventory.branches.value -= n;
                    var gain = gD.actions.exploreTheBeach.branchesPower * n;
                    log("Earnt " + timify(gain) + "!");
                    gD.time += gain;
                } else {
                    log("Not enough branches!");
                }
            }
        }
    }
};
var gD = {
    tickDuration: 25,
    time: 60,
    timeSpeed: 1,
    //watchers: 0,
    //watcherPower: 1,
    currentTab: "play",
    announcements: {
        update: {
            version: "",
            dismissed: true
        }
    },
    inventory: {
        branches : {},
    },
    actions: {
        fanTheFlames: {
            uses: 0,
            power: 5
        },
        fetch_Brushwood: {
            fatigue: 0
        },
        exploreTheBeach: {
            branchesPower: 10
        }
    },
    options: {
        numFullLogs: 100,
        logDuration: 10,
        darkTheme: false,
        autoSave: {
            enabled: setInterval(save, 60000),
            interval: 60000
        }
    },
    stats: {
        totalActions: 0,
        totalUpgrades: 0,
        totalAchievements: 0,
        playTime: 0,
        uses: {
            fanTheFlames: 0
        }
    }
};



/* unlock, cost : Object [~gD]                          Costs of unlocking and buying, default: {operator: game.operator.GE, value: cost[î], isConsumed: true}
 * -> unlock : {time: 50} ~ {time: {operator: game.operator.GE, value: 50, isConsumed: true}}
 * show : Object [type, tooltip, inside][text]          Items to be displayed. Types : standardAction, standardUpgrade, standardAchievement
 * effect : function                                    On buying
 * tick : function                                      On tick
 * repeatable : Boolean                                 Peristent
 * nocenter : Boolean                                   Multiline (action)
 * isUpgrade : Boolean                                  In case of unhandled show type
 */
 
var actions = {
    fanTheFlames: {
        repeatable: true,
        show: {
            type: "standardAction",
            tooltip: "Blow air on the fire to make it last a bit longer",
            inside: "Increases the fire duration by <b><span id='firePower'>" + gD.actions.fanTheFlames.power + " seconds</span></b>."
        },
        effect: function() {
            var gain = gD.actions.fanTheFlames.power;
            if (gD.actions.fireMastery.bought) {
                gain += 0.001 * gD.actions.fanTheFlames.uses;
            }
            gD.time += gain;
            gD.actions.fanTheFlames.uses ++;
        },
        tick: function() {
            var gain = gD.actions.fanTheFlames.power;
            if (gD.actions.fireMastery.bought) {
                gain += 0.001 * gD.actions.fanTheFlames.uses;
            }
            $("#firePower").html(timify(gain, 3));
        }
    },
    fetch_Brushwood: {
        unlock: {time: 100},
        cost: {time: 60},
        repeatable: true,
        show: {
            type: "standardAction",
            nocenter: true,
            tooltip: "Take some time to fetch brushwood on the beach, increasing the duration of the fire",
            inside: "Takes <b><span id='fetchBrushwoodLoss'></span></b> to gather brushwood and makes the fire last an additional <b><span id='fetchBrushwoodGain'></span></b>."
        },
        effect: function() {
            gD.actions.fetch_Brushwood.fatigue = Math.min(300, gD.actions.fetch_Brushwood.fatigue + 30);
            gD.time += 300 - gD.actions.fetch_Brushwood.fatigue;
        },
        tick: function() {
        var fatigue = gD.actions.fetch_Brushwood.fatigue;
            if (fatigue >= 0) {
                gD.actions.fetch_Brushwood.fatigue -= gD.tickDuration/1000;
            }
            actions.fetch_Brushwood.cost.time = 60 + fatigue;
            var color = (fatigue < 120 ? "#080" : "#A00"); // Cost < Gain
            $("#fetchBrushwoodLoss").html(timify(actions.fetch_Brushwood.cost.time)).attr("style", "color:" + color);
            $("#fetchBrushwoodGain").html(timify(300 - fatigue)).attr("style", "color:" + color);
        }
    },
    exploreTheBeach: {
        unlock: {time: 300},
        cost: {time: 300},
        repeatable: true,
        show: {
            type: "standardAction",
            tooltip: "Explore the immediate surroundings of the fire, and collect what could be useful",
            inside: "Takes <b><span id='exploreTheBeachLoss'>" + timify(300) + "</span></b> to explore the beach and possibly find loot.<br />"
        },
        effect: function() {
            var branchesFound = intRandom(1, 5);
            gD.inventory.branches.unlocked = true;
            gD.inventory.branches.value += branchesFound;
            log("You found " + branchesFound + " branches!");
        },
        tick: function() {
            $("#inv_branches_more").html(timify(gD.actions.exploreTheBeach.branchesPower));
        },
        doUnlock: function() {
            $("#inv_branches").show();
            $("#inv_branches_info").tooltip().hover(themeTooltip);
            setUseLinks("branches");
        }
    },
    /* ============================================================ UPGRADES ============================================================ */
    pyramidFire: {
        unlock: {time: 100},
        cost: {time: 600},
        show: {
            type: "standardUpgrade",
            tooltip : "Fanning the flames is twice as efficient"
        },
        effect: function() {
            gD.actions.fanTheFlames.power *= 2;
        }
    },
    fireMastery: {
        unlock: {actions: {fanTheFlames: {uses: 50}}},
        cost: {time: 500},
        show: {
            type: "standardUpgrade",
            tooltip : "Your fire skills increase with time. Fan the flames gains 0.001 power with each use"
        }
    },
    /* ============================================================ ACHIEVEMENTS ============================================================ */
    wellThatWasShort: {
        unlock: {stats: {playTime:300}},
        show: {
            type: "standardAchievement",
            tooltip: "Playing for more than 5 minutes! Time decay is halved."
        },
        effect: function() {
            gD.timeSpeed /= 2;
        }
    },
    /* ============================================================ MISCELLANEOUS ============================================================ */
    heyDood: {
        unlock: {stats: {playTime:60}},
        show: {
            type: "noDisplay"
        },
        effect: function() {
            log("This is just a test, but if you see it, it means you've spent at least 60 seconds playing. Given the fact that there's basically nothing to do, either you're a bugtracker, or you must be really bored.");
        }
    }
};
