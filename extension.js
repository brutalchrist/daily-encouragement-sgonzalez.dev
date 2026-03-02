import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

const DailyEncouragementIndicator = GObject.registerClass(
    { GTypeName: 'DailyEncouragementIndicator' },
    class DailyEncouragementIndicator extends PanelMenu.Button {
        _init(extension) {
            super._init(0.0, extension.metadata.name);
            this._extension = extension;

            const langName = GLib.get_language_names()[0] || 'en';
            this.locale = langName.startsWith('es') ? 'es' : 'en';

            const iconPath = `${this._extension.path}/images/icon.svg`;
            const icon = new St.Icon({
                gicon: Gio.icon_new_for_string(iconPath),
                style_class: 'system-status-icon',
                icon_size: 16
            });
            this.add_child(icon);

            this._loadDailyEncouragement();
        }

        _loadDailyEncouragement() {
            try {
                const date = new Date();
                const monthNames = [
                    "january", "february", "march", "april", "may", "june",
                    "july", "august", "september", "october", "november", "december"
                ];
                const dateKey = `${monthNames[date.getMonth()]}-${date.getDate()}`;

                const filePath = `${this._extension.path}/data/encouragement-${this.locale}.json`;
                const file = Gio.File.new_for_path(filePath);

                const [success, contents] = file.load_contents(null);
                if (!success) throw new Error(`No se pudo leer ${filePath}`);

                const allData = JSON.parse(new TextDecoder().decode(contents));
                const quote = allData[dateKey] || "No message found for today.";

                this._refreshUI(quote);

            } catch (e) {
                console.error(`[DailyEncouragement] Error: ${e.message}`);
                this._refreshUI(_("Error loading local data."));
            }
        }

        _refreshUI(text) {
            this.menu.removeAll();
            
            const mainBox = new St.BoxLayout({ 
                style_class: 'MainBox',
                vertical: true,
                style: 'min-width: 250px; padding: 12px;'
            });

            const title = new St.Label({
                text: _('Daily Encouragement'),
                style_class: 'Title',
                style: 'font-weight: bold; margin-bottom: 8px;'
            });
            mainBox.add_child(title);

            const encouragementLabel = new St.Label({
                text: text,
                style_class: 'Encouragement',
                reactive: true,
            });
            encouragementLabel.clutter_text.line_wrap = true;
            mainBox.add_child(encouragementLabel);

            this.menu.box.add_child(mainBox);

            encouragementLabel.connect('button-press-event', () => {
                St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
                Main.notify(_('Encouragement copied to clipboard'));
                this.menu.close();
            });
        }
    }
);

export default class DailyEncouragementExtension extends Extension {
    enable() {
        this._indicator = new DailyEncouragementIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}