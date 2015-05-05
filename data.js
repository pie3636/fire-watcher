var game = {
    version: "v0.7.3",
    onLoad: false, // Restore purchases
    onImport: false, // Load from import
    onReset: false, // Load from initValues
    onReload: false,
    logTimeout: {},
    latestLog: 5,
    latestLogSave: 0,
    numLogs: 5,
    latestFullLog: 0,
    lastDate: new Date,
    realTime: 50,
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
            use: function(n) { // TODO : Generalize function
                var gain = gD.actions.exploreTheBeach.branchesPower * n;
                log("Earnt " + timify(gain, true, 0, 3, 0) + "!");
                gainTime(gain);
                if(n == 37) {
                    gD.event.branches37 = true;
                }
            },
        },
        shells: {
            use: function(n) {
                log("DONE");
            }
        }
    }
};
var gD = {
    tickDuration: 50, // game.realTime
    time: 60,
    sessionTime: 0,
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
        branches: {},
        shells: {}
    },
    event: {
        branches37: false
    },
    actions: {
        fanTheFlames: {
            uses: 0,
            power: 5,
            usesPower: 0,
            maxBuy: 0
        },
        fetch_Brushwood: {
            fatigue: 0
        },
        exploreTheBeach: {
            minBranches: 1,
            maxBranches: 5,
            branchesPower: 10,
            shellChance: 0.1
        },
        monkey: {
            factor: 1.1,
            number: 0,
            click: 1
        }
    },
    options: {
        numFullLogs: 100,
        logDuration: 10,
        darkTheme: false,
        autoSave: {
            enabled: setInterval(save, 60000),
            interval: 60000
        },
        formatting: {
            time: 0,
            resources: 1
        }
    },
    stats: {
        totalActions: 0,
        totalUpgrades: 0,
        totalAchievements: 0,
        playTime: 0,
        timeGained: 0,
        ticks: 0,
        uses: {
            fanTheFlames: 0
        }
    }
};



/* unlock, cost, getCost(unit) : Object [~gD]                               Costs of unlocking and buying, default: {operator: game.operator.GE, value: cost[î], isConsumed: true}
 * -> unlock : {time: 50} ~ {time: {operator: game.operator.GE,             value: 50, isConsumed: true}}
 * show : Object [type, tooltip, inside, nocenter, name][title]             Items to be displayed. Types : action, upgrade, achievement
 * effect [unit] : function                                                 On buying
 * tick : function                                                          On tick
 * doUnlock : function                                                      On unlock
 * repeatable : Boolean                                                     Peristent
 * nocenter : Boolean                                                       Multiline (action)
 * isUpgrade : Boolean                                                      In case of unhandled show type
 * noUnLockOnLoad : Boolean                                                 Prevents doUnlock() from being called on load
 */
 
var actions = {
    fanTheFlames: {
        repeatable: true,
        show: {
            type: "action",
            tooltip: "Blow air on the fire to make it last a bit longer",
            inside: "Increase the fire duration by <b><span id='firePower'>" + gD.actions.fanTheFlames.power + " seconds</span></b>."
        },
        effect: function(i) {
            i = set(i, 1);
            var gain = gD.actions.fanTheFlames.power + gD.actions.fanTheFlames.usesPower * gD.stats.uses.fanTheFlames;
            gainTime(i*gain);
            gD.stats.uses.fanTheFlames += i;
        },
        tick: function() {
            var gain = gD.actions.fanTheFlames.power + gD.actions.fanTheFlames.usesPower * gD.stats.uses.fanTheFlames;
            $("#firePower").html(timify(gain, true, 0, 2, 3));
        }
    },
    fetch_Brushwood: {
        unlock: {time: 100},
        cost: {time: 60},
        repeatable: true,
        show: {
            type: "action", 
            tooltip: "Take some time to fetch brushwood on the beach, increasing the duration of the fire",
            inside: "Take <b><span id='fetchBrushwoodLoss'></span></b> to gather brushwood and make the fire last an additional <b><span id='fetchBrushwoodGain'></span></b>."
        },
        effect: function() {
            gainTime(300 - gD.actions.fetch_Brushwood.fatigue);
            $(".animate").remove();
            animate(300 - gD.actions.fetch_Brushwood.fatigue - actions.fetch_Brushwood.cost.time, gD.currentTab == "opt");
            gD.actions.fetch_Brushwood.fatigue = Math.min(300, gD.actions.fetch_Brushwood.fatigue + 30);
        },
        tick: function() {
            var fatigue = gD.actions.fetch_Brushwood.fatigue;
            if (fatigue >= 0) {
                gD.actions.fetch_Brushwood.fatigue = floorx(fatigue - game.realTime/1000    , 2);
            }
            actions.fetch_Brushwood.cost.time = 60 + fatigue;
            var color = (fatigue < 120 ? "#080" : "#A00"); // Cost < Gain
            $("#fetchBrushwoodLoss").html(timify(actions.fetch_Brushwood.cost.time, true, 0, 2, 0)).attr("style", "color:" + color);
            $("#fetchBrushwoodGain").html(timify(300 - fatigue, true, 0, 2, 0)).attr("style", "color:" + color);
        }
    },
    exploreTheBeach: {
        unlock: {time: 300},
        cost: {time: 300},
        repeatable: true,
        show: {
            type: "action",
            tooltip: "Explore the immediate surroundings of the fire, and collect what could be useful",
            inside: "Take <b><span id='exploreTheBeachLoss'></span></b> to explore the beach and possibly find loot.<br />"
        },
        effect: function() {
            var branchesFound = intRandom(gD.actions.exploreTheBeach.minBranches, gD.actions.exploreTheBeach.maxBranches);
            gD.inventory.branches.value += branchesFound;
            var strValue = timify(gD.inventory.branches.value, false, 1, 1, 3);
            log("You found " + timify(branchesFound, false, 0, 1, 3) + " branches! Total : " + strValue);
            if (Math.random() < gD.actions.exploreTheBeach.shellChance) {
                if (!gD.inventory.shells.value) {
                    gD.inventory.shells.unlocked = true;
                    $("#inv_shells").show();
                    $("#inv_shells_info").tooltip().hover(themeTooltip);
                }
                gD.inventory.shells.value++;
                var strValue = timify(gD.inventory.shells.value, false, 1, 1, 3);
                log("You found a shell! Total : " + strValue);
            }
        },
        tick: function() {
            $("#inv_branches_more").html(timify(gD.actions.exploreTheBeach.branchesPower, true, 0, 2, 0));
            $("#inv_shell_more").html(gD.actions.exploreTheBeach.shellChance * 100 + " %");
        },
        doUnlock: function() {
            $("#exploreTheBeachLoss").html(timify(300, true, 0, 2, 0)); 
            gD.inventory.branches.unlocked = true;
            $("#inv_branches").show();
            $("#inv_branches_info").tooltip().hover(themeTooltip);
            setUseLinks("branches");
            setUseLinks("shells");
        }
    },
    /* ============================================================ UNITS ============================================================ */
    monkey: {
        unlock: {time: 300, actions: {forestExploration: {bought: true}}},
        cost: {time: 10},
        noUnlockOnLoad: true,
        getCost: function(j) {
            j = Math.min(j, 4); // Just in case, lol
            return {time: sumPrices(actions.monkey.cost.time, gD.actions.monkey.factor, gD.actions.monkey.number, Math.pow(10, j - 1), gD.time, (j == 4))};
        },
        repeatable: true,
        show: {
            type: "unit",
            tooltip: "A monkey found in the forest. Each has a 1% chance to click every second. Get 100 of them and they'll click more regularly."
        },
        effect: function(j) {
            if (j) {
                gD.actions.monkey.number += (j == 4 ? gD.actions.monkey.maxBuy : Math.pow(10, j - 1));
            }
            var str = timify(gD.actions.monkey.number, false, 1, 1, 0);
            $("#monkeyNumber").html(str);
            $("#monkeyCost").html(timify(sumPrices(actions.monkey.cost.time, gD.actions.monkey.factor, gD.actions.monkey.number, 1), true, 1, 2, 0));
            $("#monkeyProduction").html(gD.actions.monkey.number < 100 ? "Variable" : timify(gD.actions.monkey.number/1e2 * gD.actions.monkey.click, false, 0, 1, 2) + " clicks/s");
        },
        tick: function() {
            gD.actions.monkey.maxBuy = sumPrices(actions.monkey.cost.time, gD.actions.monkey.factor, gD.actions.monkey.number, 0, gD.time, true, true);
            $("#monkey4").html("Max (" + gD.actions.monkey.maxBuy + ")");
            if (gD.actions.monkey.number < 100 && !(gD.stats.ticks % (Math.floor(1000/game.realTime)))) {
                for (var i = 1; i <= gD.actions.monkey.number; i++) {
                    if (Math.random() <= 0.01)
                    {
                        actions.fanTheFlames.effect(gD.actions.monkey.click);
                    }
                }
            } else if (!(gD.stats.ticks % (Math.floor(1000/game.realTime)))) {
                actions.fanTheFlames.effect(gD.actions.monkey.number * game.realTime/1e5 * gD.actions.monkey.click * Math.floor(1000/game.realTime));
            }
        },
        doUnlock: function() {
            log("You did it, congrats! You unlocked monkeys with tremendous fanning abilities!");
        }
    },
    /* ============================================================ UPGRADES ============================================================ */
    pyramidFire: {
        unlock: {time: 100},
        cost: {time: 600},
        show: {
            type: "upgrade",
            tooltip: "Fanning the flames is twice as efficient"
        },
        effect: function() {
            gD.actions.fanTheFlames.power *= 2;
        }
    },
    campfire: {
        unlock: {stats: {uses: {fanTheFlames: 50}}},
        cost: {time: 500},
        show: {
            type: "upgrade",
            tooltip: "This fire should last all night! Fan the flames gains 0.001 power with each use"
        },
        effect: function() {
            gD.actions.fanTheFlames.usesPower += 0.001;
        }
    },
    bonfire: {
        unlock: {stats: {uses: {fanTheFlames: 250}}},
        cost: {time: 2000},
        show: {
            type: "upgrade",
            tooltip: "Time to celebrate, even if you're not too sure what. Fan the flames gains 0.001 power with each use"
        },
        effect: function() {
            gD.actions.fanTheFlames.usesPower += 0.001;
        }
    },
    fireMastery: {
        unlock: {stats: {uses: {fanTheFlames: 1000}}},
        cost: {time: 10000},
        show: {
            type: "upgrade",
            tooltip: "Your fire skills increase with time. Fan the flames gains 0.002 power with each use"
        },
        effect: function() {
            gD.actions.fanTheFlames.usesPower += 0.002;
        }
    },
    twistrike: {
        unlock: {actions: {monkey: {number: 20}}},
        cost: {time: 2400},
        show: {
            type: "upgrade",
            tooltip: "Monkeys are twice as efficient"
        },
        effect: function() {
            gD.actions.monkey.click *= 2;
        }
    },
    withBothHands: {
        unlock: {actions: {monkey: {number: 50}}},
        cost: {time: 9600},
        show: {
            type: "upgrade",
            tooltip: "Monkeys are twice as efficient"
        },
        effect: function() {
            gD.actions.monkey.click *= 2;
        }
    },
    forestExploration: {
        unlock: {time: 900},
        cost: {time: 1500},
        show: {
            type: "upgrade",
            tooltip: "Venture into the forest to find creatures, and hire them"
        },
        effect: function() {
            log("Now all you need is a little <i>time</i>");
        }
    },
    bananaTrees: {
        unlock: {actions: {monkey: {number: 100}}},
        cost: {time: 27000},
        show: {
            type: "upgrade",
            tooltip: "Monkeys are way cheaper"
        },
        effect: function() {
            gD.actions.monkey.factor = 1.05;
        }
    },
    /* ============================================================ ACHIEVEMENTS ============================================================ */
    threeHundredSeconds: {
        unlock: {stats: {playTime:300}},
        show: {
            type: "achievement",
            tooltip: "Playing for 5 minutes! Time decay is decreased by 10%"
        },
        effect: function() {
            gD.timeSpeed *= 0.9;
        }
    },
    misunderstanding: {
        unlock: {event: {branches37: true}},
        show: {
            type: "achievement",
            tooltip: "Using exactly 37 branches at once"
        }
    },
    b15: {
        unlock: {stats: {uses: {fanTheFlames: 1111}}},
        show: {
            type: "achievement",
            tooltip: "You've fanned the flames 1,111 times! Increases branches gain",
            title: "15"
        },
        effect: function() {
            gD.actions.exploreTheBeach.maxBranches *= 3;
        }
    },
    interstellar: {
        unlock: {time: 4354317648e8},
        show: {
            type: "achievement",
            tooltip: "13.8 billion years? That's the age of the Universe!"
        },
        effect: function() {
            //TODO
        }
    },
    negatron: {
        unlock: {time: {operator: game.operator.LT, value: 0}},
        show: {
            type: "achievement",
            tooltip: "This makes no sense at all..."
        },
        effect: function() {
            //TODO
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

