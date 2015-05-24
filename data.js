/*      
exploreTheBeach: {
    minBranches: 1,
    maxBranches: 5, // ERLKÖNIIIIIIIIIIIIIIIIIG
    branchesPower: 10,
},
sparklingEmbers: {
    power: 0.5,
    duration: 0,
    maxDuration: 10000,
    probability: 0.014
*/
    var game = {
    version: "v0.7.7",
    onLoad: false, // Restore purchases
    onImport: false, // Load from import
    onReset: false, // Load from initValues
    onReload: false,
    logTimeout: {},
    logFlashTimeout: 0,
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
                if (n == 37) {
                    gD.event.branches37 = true;
                }
            },
        },
        shells: {
            use: function(n) {
                var _ = gD.inventory.shells;
                var gain = 0;
                if (n < 100) {
                    for (var i = 1; i <= n; i++) {
                        if (Math.random() <= gD.inventory.shells.inkChance) {
                            gain++;
                        }
                    }
                } else if (!(gD.stats.ticks % (Math.floor(1e3/game.realTime)))) {
                    gain = n * game.realTime/1e3/_.inkChance * _.production * Math.floor(1e3/game.realTime);
                }
                gD.inventory.ink.value += gain;
                log("You found " + (gain ? gain : "no") + " ink sac" + (gain != 1 ? "s" : "") + ".");
            }
        },
        planks: {
            craft: function(str) {
                var _ = gD.inventory.planks;
                var I = gD.inventory.branches
                var n;
                if (str == "all") {
                    n = Math.floor(I.value/_.branchesCost);
                } else {
                    n = (str * _.branchesCost <= I.value ? str : 0);
                }
                I.value -= Number(n) * _.branchesCost;
                _.value += Number(n);
                log("You crafted " + (n ? n : "no") + " branche" + (n != 1 ? "s" : "") + ".");
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
        branches: {use: true},
        shells: {use: true, inkChance: 0.1, production: 1},
        planks: {craft: true, branchesCost: 50},
        ink: {}
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
            baseTime: 60,
            decay: 1
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
            click: 1,
            clickProbability: 0.01
        },
        sparklingEmbers: {
            bought: true,
            power: 0.5,
            duration: 0,
            maxDuration: 10000,
            probability: 0.01
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

var utilities = {
    use: function(item, str) {
        var n = (str == "all" ? gD.inventory[item].value : str);
        if (n <= gD.inventory[item].value && n) {
            gD.inventory[item].value -= n;
            return n;
        } else {
            log("Not enough " + item + "!");
            return 0;
        }
    },
    craft: function(item, str) {
        return str;
    },
}



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
 * onLoad : Boolean                                                         Call effect() on load
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
            var I = "#fetch_BrushwoodInside";
            _.fatigue = Math.max(0, floorx(_.fatigue - _.decay * game.realTime/1000, 2));
            X.cost.time = _.baseTime + _.fatigue;
            var color = (X.cost.time < _.maxGain - _.fatigue ? "#080" : "#A00"); // Cost < Gain
            $("#fetchBrushwoodLoss").html(timify(X.cost.time, true, 0, 2, 0)).attr("style", "color:" + color);
            $("#fetchBrushwoodGain").html(timify(_.maxGain - _.fatigue, true, 0, 2, 0)).attr("style", "color:" + color);
            if (numberLines(I) > 1 && $(I).hasClass("top6")) {
                $(I).removeClass("top6");
            }
            if (numberLines(I) == 1 && !$(I).hasClass("top6")) {
                $(I).addClass("top6");
            }
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
                I.shells.unlocked = true;
                I.ink.unlocked = true;
                I.shells.value++;
                var strValue = timify(I.shells.value, false, 1, 1, 3);
                log("You found a shell! Total : " + strValue);
            }
        },
        tick: function() {
            var _ = gD.actions.exploreTheBeach;
            $("#inv_branches_more").html(timify(_.branchesPower, true, 0, 2, 0));
            $("#inv_shell_more").html(gD.inventory.shells.inkChance * 100 + " %");
            $("#inv_shell_more2").html(gD.inventory.shells.production);
            $("#inv_planks_more").html(gD.inventory.planks.branchesCost);
        },
        doUnlock: function() {
            $("#exploreTheBeachLoss").html(timify(300, true, 0, 2, 0));
            gD.inventory.branches.unlocked = true;
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
            if (_.number < 100 && !(gD.stats.ticks % (Math.floor(1e3/game.realTime)))) {
                for (var i = 1; i <= _.number; i++) {
                    if (Math.random() <= _.clickProbability) {
                        actions.fanTheFlames.effect(_.click);
                    }
                }
            } else if (!(gD.stats.ticks % (Math.floor(1e3/game.realTime)))) {
                actions.fanTheFlames.effect(_.number * game.realTime/1e3 * _.clickProbability * _.click * Math.floor(1e3/game.realTime));
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
            tooltip: "Doubles the base power of 'Fan the flames'"
        },
        effect: function() {
            gD.actions.fanTheFlames.power *= 2;
        }
    },
    dryFirewood: {
        unlock: {time: 888},
        cost: {time: 7777},
        show: {
            type: "upgrade",
            tooltip: "Doubles the base power of 'Fan the flames'"
        },
        effect: function() {
            gD.actions.fanTheFlames.power *= 2;
        }
    },
    woodResin: {
        unlock: {time: 16500},
        cost: {time: 190000},
        show: {
            type: "upgrade",
            tooltip: "Doubles the base power of 'Fan the flames'"
        },
        effect: function() {
            gD.actions.fanTheFlames.power *= 10;
        }
    },
    smallLogs: {
        unlock: {time: 10000},
        cost: {time: 12345},
        show: {
            type: "upgrade",
            tooltip: "You found a spot with small logs you can carry to the fire. Makes brushwood fetching fifteen times as efficient."
        },
        effect: function() {
            var _ = gD.actions.fetch_Brushwood;
            _.maxGain *= 15;
            _.maxFatigue *= 15;
            _.fatiguePerUse *= 15;
            _.decay *= 15
            _.baseTime *= 15;
        }
    },
    timber: {
        unlock: {time: 900},
        cost: {time: 1200},
        show: {
            type: "upgrade",
            tooltip: "Going deeper inside the wood, you end up finding bigger and bigger trunks and logs. Brushwood fetching is ten times more efficient."
        },
        effect: function() {
            var _ = gD.actions.fetch_Brushwood;
            _.maxGain *= 10;
            _.maxFatigue *= 10;
            _.fatiguePerUse *= 10;
            _.decay *= 10
            _.baseTime *= 10;
        }
    },
    longSunsetWalks: {
        unlock: {time: 480000},
        cost: {time: 500000},
        show: {
            type: "upgrade",
            tooltip: "You're roaming farther away from home. Increases the number of branches you can carry" //TODO But takes longer -> Cost :/
        },
        effect: function() {
            gD.actions.exploreTheBeach.maxBranches *= 3;
        },
    },
    planks: {
        unlock: {time: 1500},
        cost: {time: 1780, inventory: {branches: {value: 50}}},
        onLoad: true,
        show: {
            type: "upgrade",
            tooltip: "Hey! What if I tried sawing that wood? Unlocks planks crafting in the Inventory tab"
        },
        effect: function() {
            setUseLinks("planks");
            $("#inv_planks").show();
            $("#inv_planks_info").tooltip().hover(themeTooltip);
            gD.inventory.planks.unlocked = true;
        }
    },
    betterTying: {
        unlock: {inventory: {planks: {value: 10}}},
        cost: {time: 145000},
        show: {
            type: "upgrade",
            tooltip: "Tie the branches together with string, improving their quality and rentability"
        },
        effect: function() {
            gD.inventory.planks.branchesCost -= 10;
        }
    },
    vegetalGlue: {
        unlock: {inventory: {planks: {value: 28}}},
        cost: {time: 495000},
        show: {
            type: "upgrade",
            tooltip: "Use natural resin to make branches stick together, making better planks and decreasing their cost"
        },
        effect: function() {
            gD.inventory.planks.branchesCost -= 10;
        }
    },
    handNet: {
        unlock: {inventory: {shells: {value: 10}}},
        cost: {time: 25000, inventory: {planks: {value: 1}}},
        show: {
            type: "upgrade",
            tooltip: "This small hand net will greatly increase your odds of finding shells on the beach"
        },
        effect: function() {
            gD.actions.exploreTheBeach.shellChance += 0.2;
        }
    },
    telescopicHandNet: {
        unlock: {inventory: {shells: {value: 20}}},
        cost: {time: 84000, inventory: {planks: {value: 5}}},
        show: {
            type: "upgrade",
            tooltip: "Extra long handle, extra shells"
        },
        effect: function() {
            gD.actions.exploreTheBeach.shellChance += 0.3;
        }
    },
    shellFarm: {
        unlock: {inventory: {shells: {value: 60}}},
        cost: {time: 135000},
        show: {
            type: "upgrade",
            tooltip: "Start a shell farm. Your now happy and fed shells have a higher chance to produce ink"
        },
        effect: function() {
            gD.inventory.shells.inkChance += 0.1;
        }
    },
    shellFactory: {
        unlock: {inventory: {shells: {value: 220}}},
        cost: {time: 2976000},
        show: {
            type: "upgrade",
            tooltip: "Though not very modern, this factory will allow you to optimize ink extraction. Increases ink chance"
        },
        effect: function() {
            gD.inventory.shells.inkChance += 0.15;
        }
    },
    healthyShellFood: {
        unlock: {inventory: {shells: {value: 100}}},
        cost: {time: 750000},
        show: {
            type: "upgrade",
            tooltip: "What do they eat anyway? Shells produce three times as much ink"
        },
        effect: function() {
            gD.inventory.shells.production *= 3;
        }
    },
    gmoShells: {
        unlock: {inventory: {shells: {value: 330}}},
        cost: {time: 15000000},
        show: {
            type: "upgrade",
            title: "GMO shells",
            tooltip: "Why wait for evolution to kick in when you have GMOs? Increases ink production tenfold"
        },
        effect: function() {
            gD.inventory.shells.production *= 10;
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
    xiuhtecuhtli: {
        unlock: {stats: {uses: {fanTheFlames: 10000}}},
        cost: {time: 120000},
        show: {
            type: "upgrade",
            tooltip: "Just try to pronounce it. Fan the flames gains 0.003 power with each use"
        },
        effect: function() {
            gD.actions.fanTheFlames.usesPower += 0.003;
        }
    },
    kagutsuchi: {
        unlock: {stats: {uses: {fanTheFlames: 100000}}},
        cost: {time: 1750000},
        show: {
            type: "upgrade",
            tooltip: "May your inner flame shine forevermore. Fan the flames gains 0.005 power with each use"
        },
        effect: function() {
            gD.actions.fanTheFlames.usesPower += 0.005;
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
    bananaTrees: {
        unlock: {actions: {monkey: {number: 100}}},
        cost: {time: 1270000},
        show: {
            type: "upgrade",
            tooltip: "Monkeys are way cheaper"
        },
        effect: function() {
            gD.actions.monkey.factor = 1.05;
        }
    },
    shakespeare: {
        unlock: {actions: {monkey: {number: 75}}},
        cost: {time: 97000},
        show: {
            type: "upgrade",
            title: "Shakespeare's plays",
            tooltip: "Monkeys click more often"
        },
        effect: function() {
            gD.actions.monkey.clickProbability *= 2;
        }
    },
    sparklingEmbers: {
        unlock: {},
        noStats: true,
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
        show: {type: "achievement",
            tooltip: "Playing for 5 minutes! Time decay is decreased by 10% (don't expect that to happen too often)"
        },
        effect: function() {
            gD.timeSpeed *= 0.9;
        }
    },
    dedication: {
        unlock: {stats: {playTime:3600}},
        show: {
            type: "achievement",
            tooltip: "This achievement is pie3636 approved. Time decay -10%"
        },
        effect: function() {
            gD.timeSpeed *= 0.9;
        }
    },
    woahDude: {
        unlock: {stats: {playTime:36000}},
        show: {
            type: "achievement",
            tooltip: "It's not *that* hard, if you're idle. Time decay -10%"
        },
        effect: function() {
            gD.timeSpeed *= 0.9;
        }
    },
    addicted: {
        unlock: {stats: {playTime:360000}},
        show: {
            type: "achievement",
            tooltip: "You literally spent more time playing this game than me coding it. Kudos to you! Time decay -10%"
        },
        effect: function() {
            gD.timeSpeed *= 0.9;
        }
    },
    two_PiRadians: {
        unlock: {stats: {timeGained:3600}},
        show: {
            type: "achievement",
            tooltip: "Tick tock goes the clock..."
        },
    },
    fullTimeJob: {
        unlock: {stats: {timeGained:86400}},
        show: {
            type: "achievement",
            tooltip: "You might be working overtime"
        },
    },
    delayedSevenfold: {
        unlock: {stats: {timeGained:604800}},
        show: {
            type: "achievement",
            tooltip: "Alright, guys. The fire should be alright for a while"
        },
    },
    julianYear: {
        unlock: {stats: {timeGained:31557600}},
        show: {
            type: "achievement",
            tooltip: "No leap seconds!"
        },
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
        }
    },
    negatron: {
        unlock: {time: {operator: game.operator.LT, value: 0}},
        show: {
            type: "achievement",
            tooltip: "This makes no sense at all..."
        }
    },
    procrastination: {
        unlock: {actions: {monkey: {number: 20}}},
        show: {
            type: "achievement",
            tooltip: "For a while, you've been having enough monkeys to idle without losing time"
        }
    },
    /* ============================================================ MISCELLANEOUS ============================================================ */
    heyDood: {
        unlock: {stats: {playTime:60}},
        show: {
            type: "noDisplay"
        },
        effect: function() {
            log("Hello! You've been playing for a minute. <i>Yep, that's all I wanted to say.   </i>");
        }
    },
};

