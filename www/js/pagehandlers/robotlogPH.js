/* global PageHandler, $, NetworkTables, app, RobotLog */
// javascript page handler for robotlog.html
//

class RobotlogPH extends PageHandler
{
    constructor(config, pageTemplate)
    {
        super(config, pageTemplate);
        this.msgTmplt = "<div class='logmsg'>" +
                "<span class='timestamp'>{ts} </span>" +
                "<span class='{lvlcls}'>{lvlpad} </span>" +
                "<span class='namespace'>{nmspc} </span>" +
                "{msg}</div>";
        this.filter = "";
        this.knownLogLevels = ["DEBUG", "INFO", "NOTICE", "WARNING", 
                                "ERROR", "Exception"];
    }

    pageLoaded(targetElem, html) 
    {
        let self = this;
        targetElem.innerHTML = html; // was: app.interpolate(html, map);

        // first initialize selectors from network tables.
        $(".selector").each(function() {
            var key = $(this).attr("id");
            var val = app.getValue(key);
            if (val !== "")
            {
                $(this).val(val);
            }
        });

        // now update network tables on changes
        $(".selector").change(function() {
            var value = $(this).val();
            var key = $(this).attr("id");
            app.putValue(key, value);
		});

        $("#filter").val(this.filter);
        $("#filter").on("input", function() {
            self.filter = $(this).val();
            self.onFilterChange();
        });

        RobotLog.setLogListener(this.onRobotMsg.bind(this), true);
    }

    onNetTabChange(key, value, isNew) 
    {
        switch(key) 
        {
        case "/SmartDashboard/Robot/Verbosity":
            var sel = document.getElementById("Robot/Verbosity");
            if(sel)
            {
                sel.value = value;
            }
            break;
        default:
            break;
		}
    }

    onFilterChange() 
    {
        $("#robotlog").html("");
        RobotLog.replayLogs();
    }

    onRobotMsg(msg) 
    {
        // nb: this isn't valid in this context
        if(msg == null)
        {
            // equivalent to onFilterChange
            $("#robotlog").html("");
            RobotLog.replayLogs();
            return;
        }
        if(!(/\S/.test(msg))) return; // ignore messages with whitespace-only
        if(this.filter) {
            if(-1 === msg.indexOf(this.filter)) return;
        }
        // presumed message format:
        //  timestamp errorclass namespace text
        var fields = msg.split(" ");
        var ts = fields[0];
        var lvlcls = fields[1];
        var nmspc;
        var msgtxt;
        if(!lvlcls || -1 === this.knownLogLevels.indexOf(lvlcls))
        {
            lvlcls = "UNKNOWN";
            nmspc = "";
            msgtxt = fields.slice(3).join(" ");
        }
        else
        {
            nmspc = fields[2];
            msgtxt = fields.slice(2).join(" ");
        }
        var lvlpad = (lvlcls + ".....").slice(0,9); // Exception is longest lvl
        var map = {
            ts: ts,
            lvlcls: lvlcls,
            lvlpad: lvlpad,
            nmspc: nmspc,
            msg: msgtxt,
        };
        $("#robotlog").append(app.interpolate(this.msgTmplt, map));
    }
}

window.RobotlogPH = RobotlogPH; 