var game = {
    version: "v0.7.4",
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
    timeMultiplier: 1,
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
            fatigue: 0,
            fatiguePerUse: 30,
            maxFatigue: 300,
            maxGain: 300,
            baseTime: 60
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
        },
        sparklingEmbers: {
            bought: true,
            power: 0.5,
            duration: 0,
            maxDuration: 10000,
            probability: 0.014  
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
            var _ = gD.actions.fanTheFlames;
            i = set(i, 1);
            var gain = _.power + _.usesPower * gD.stats.uses.fanTheFlames;
            gainTime(i*gain);
            gD.stats.uses.fanTheFlames += i;
        },
        tick: function() {
            var _ = gD.actions.fanTheFlames;
            var gain = _.power + _.usesPower * gD.stats.uses.fanTheFlames;
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
            var _ = gD.actions.fetch_Brushwood;
            gainTime(_.maxGain - _.fatigue);
            $(".animate").remove();
            animate(_.maxGain - _.fatigue - actions.fetch_Brushwood.cost.time, gD.currentTab == "opt");
            _.fatigue = Math.min(_.maxFatigue, _.fatigue + _.fatiguePerUse);
        },
        tick: function() {
            var _ = gD.actions.fetch_Brushwood;
            var X = actions.fetch_Brushwood;
            _.fatigue = Math.max(0, floorx(_.fatigue - game.realTime/1000, 2));
            X.cost.time = _.baseTime + _.fatigue;
            var color = (X.cost.time < _.maxGain - _.fatigue ? "#080" : "#A00"); // Cost < Gain
            $("#fetchBrushwoodLoss").html(timify(X.cost.time, true, 0, 2, 0)).attr("style", "color:" + color);
            $("#fetchBrushwoodGain").html(timify(_.maxGain - _.fatigue, true, 0, 2, 0)).attr("style", "color:" + color);
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
            var _ = gD.actions.exploreTheBeach;
            var I = gD.inventory;
            var branchesFound = intRandom(_.minBranches, _.maxBranches);
            I.branches.value += branchesFound;
            var strValue = timify(I.branches.value, false, 1, 1, 3);
            log("You found " + timify(branchesFound, false, 0, 1, 3) + " branches! Total : " + strValue);
            if (Math.random() < _.shellChance) {
                if (!I.shells.value) {
                    I.shells.unlocked = true;
                    $("#inv_shells").show();
                    $("#inv_shells_info").tooltip().hover(themeTooltip);
                }
                I.shells.value++;
                var strValue = timify(I.shells.value, false, 1, 1, 3);
                log("You found a shell! Total : " + strValue);
            }
        },
        tick: function() {
            var _ = gD.actions.exploreTheBeach;
            $("#inv_branches_more").html(timify(_.branchesPower, true, 0, 2, 0));
            $("#inv_shell_more").html(_.shellChance * 100 + " %");
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
        repeatable: true,
        getCost: function(j) {
            var _ = gD.actions.monkey;
            j = Math.min(j, 4); // Just in case, lol
            return {time: sumPrices(actions.monkey.cost.time, _.factor, _.number, Math.pow(10, j - 1), gD.time, (j == 4))};
        },
        show: {
            type: "unit",
            tooltip: "A monkey found in the forest. Each has a 1% chance to click every second. Get 100 of them and they'll click more regularly."
        },
        effect: function(j) {
            var _ = gD.actions.monkey;
            if (j) {
                _.number += (j == 4 ? _.maxBuy : Math.pow(10, j - 1));
            }
            var str = timify(_.number, false, 1, 1, 0);
            $("#monkeyNumber").html(str);
            $("#monkeyCost").html(timify(sumPrices(actions.monkey.cost.time, _.factor, _.number, 1), true, 1, 2, 0));
            $("#monkeyProduction").html(_.number < 100 ? "Variable" : timify(_.number/1e2 * _.click, false, 0, 1, 2) + " clicks/s");
        },
        tick: function() {
            var _ = gD.actions.monkey;
            _.maxBuy = sumPrices(actions.monkey.cost.time, _.factor, _.number, 0, gD.time, true, true);
            $("#monkey4").html("Max (" + _.maxBuy + ")");
            if (_.number < 100 && !(gD.stats.ticks % (Math.floor(1000/game.realTime)))) {
                for (var i = 1; i <= _.number; i++) {
                    if (Math.random() <= 0.01)
                    {
                        actions.fanTheFlames.effect(_.click);
                    }
                }
            } else if (!(gD.stats.ticks % (Math.floor(1000/game.realTime)))) {
                actions.fanTheFlames.effect(_.number * game.realTime/1e5 * _.click * Math.floor(1000/game.realTime));
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
            log("Now all you need is a little <i>time</i>...");
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
    sparklingEmbers: {
        unlock: {},
        noStats: true,
        show: {
            type: "noDisplay"
        },
        show: {
            type: "upgrade",
            tooltip: "Burn, fire, burn!"
        },
        effect: function() {
            var _ = gD.actions.sparklingEmbers;
            log("Sparkling embers activated! Time decay is decreased for " + timify(_.maxDuration/1000, true, 0, 3, 0) + "!");
            game.timeMultiplier = _.power;
            _.duration = _.maxDuration;
        },
        tick: function() {
            var _ = gD.actions.sparklingEmbers;
            _.duration = Math.max(0, _.duration - game.realTime);
            if (!_.duration) {
                game.timeMultiplier = 1;
            }
            if (Math.random() < invProbaPerSec(_.probability)) {
                if (_.bought) {
                    _.bought = false;
                    _.unlocked = false;
                }
            }
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
    },
};

