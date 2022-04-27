import { App, PluginSettingTab, debounce } from 'obsidian';
import React from 'react';
import ReactDOM from 'react-dom';

import ZoteroConnector from '../main';
import {
  CitationFormat,
  ExportFormat,
  ZoteroConnectorSettings,
} from '../types';
import { AssetDownloader } from './AssetDownloader';
import { CiteFormatSettings } from './CiteFormatSettings';
import { ExportFormatSettings } from './ExportFormatSettings';
import { SettingItem } from './SettingItem';

interface SettingsComponentProps {
  settings: ZoteroConnectorSettings;
  addCiteFormat: (format: CitationFormat) => CitationFormat[];
  updateCiteFormat: (index: number, format: CitationFormat) => CitationFormat[];
  removeCiteFormat: (index: number) => CitationFormat[];
  addExportFormat: (format: ExportFormat) => ExportFormat[];
  updateExportFormat: (index: number, format: ExportFormat) => ExportFormat[];
  removeExportFormat: (index: number) => ExportFormat[];
  updateSetting: (key: keyof ZoteroConnectorSettings, value: any) => void;
}

function SettingsComponent({
  settings,
  addCiteFormat,
  updateCiteFormat,
  removeCiteFormat,
  addExportFormat,
  updateExportFormat,
  removeExportFormat,
  updateSetting,
}: SettingsComponentProps) {
  const [citeFormatState, setCiteFormatState] = React.useState(
    settings.citeFormats
  );
  const [exportFormatState, setExportFormatState] = React.useState(
    settings.exportFormats
  );

  const [ocrState, setOCRState] = React.useState(settings.pdfExportImageOCR);
  const [citeSuggestState, setCiteSuggestState] = React.useState(
    !!settings.shouldShowCiteSuggest
  );

  const updateCite = React.useCallback(
    debounce(
      (index: number, format: CitationFormat) => {
        setCiteFormatState(updateCiteFormat(index, format));
      },
      200,
      true
    ),
    [updateCiteFormat]
  );

  const addCite = React.useCallback(() => {
    setCiteFormatState(
      addCiteFormat({
        name: `Format #${citeFormatState.length + 1}`,
        format: 'formatted-citation',
      })
    );
  }, [addCiteFormat, citeFormatState]);

  const removeCite = React.useCallback(
    (index: number) => {
      setCiteFormatState(removeCiteFormat(index));
    },
    [removeCiteFormat]
  );

  const updateExport = React.useCallback(
    debounce(
      (index: number, format: ExportFormat) => {
        setExportFormatState(updateExportFormat(index, format));
      },
      200,
      true
    ),
    [updateExportFormat]
  );

  const addExport = React.useCallback(() => {
    setExportFormatState(
      addExportFormat({
        name: `Import #${exportFormatState.length + 1}`,
        outputPathTemplate: '{{citekey}}.md',
        imageOutputPathTemplate: '{{citekey}}/',
        imageBaseNameTemplate: 'image',
      })
    );
  }, [addExportFormat, citeFormatState]);

  const removeExport = React.useCallback(
    (index: number) => {
      setExportFormatState(removeExportFormat(index));
    },
    [removeExportFormat]
  );

  return (
    <>
      <SettingItem name="General Settings" isHeading />
      <AssetDownloader
        exeVersion={settings.exeVersion}
        updateSetting={updateSetting}
      />
      <SettingItem name="Database" description="Supports Zotero and Juris-M">
        <select
          className="dropdown"
          defaultValue={settings.database}
          onChange={(e) => updateSetting('database', e.target.value)}
        >
          <option value="Zotero">Zotero</option>
          <option value="Juris-M">Juris-M</option>
        </select>
      </SettingItem>
      <SettingItem
        name="Note Import Location"
        description="Notes imported from Zotero will be added to this folder in your vault"
      >
        <input
          onChange={(e) => updateSetting('noteImportFolder', e.target.value)}
          type="text"
          spellCheck="false"
          placeholder="Example: folder 1/folder 2"
          defaultValue={settings.noteImportFolder}
        />
      </SettingItem>
      <SettingItem
        name="Enable Cite Key Autocomplete"
        description="Typing the @ symbol will display an autocomplete dialog for citation keys"
      >
        <div
          onClick={() => {
            setCiteSuggestState((state) => {
              updateSetting('shouldShowCiteSuggest', !state);
              return !state;
            });
          }}
          className={`checkbox-container${
            citeSuggestState ? ' is-enabled' : ''
          }`}
        />
      </SettingItem>
      <SettingItem name="Citation Formats" isHeading />
      <SettingItem>
        <button onClick={addCite} className="mod-cta">
          Add Citation Format
        </button>
      </SettingItem>
      {citeFormatState.map((f, i) => {
        return (
          <CiteFormatSettings
            key={i}
            format={f}
            index={i}
            updateFormat={updateCite}
            removeFormat={removeCite}
          />
        );
      })}

      <SettingItem name="Import Formats" isHeading />
      <SettingItem>
        <button onClick={addExport} className="mod-cta">
          Add Import Format
        </button>
      </SettingItem>
      {exportFormatState.map((f, i) => {
        return (
          <ExportFormatSettings
            key={exportFormatState.length - i}
            format={f}
            index={i}
            updateFormat={updateExport}
            removeFormat={removeExport}
          />
        );
      })}

      <SettingItem
        name="Import Image Settings"
        description="Rectangle annotations will be extracted from PDFs as images."
        isHeading
      />
      <SettingItem name="Image Format">
        <select
          className="dropdown"
          defaultValue={settings.pdfExportImageFormat}
          onChange={(e) =>
            updateSetting('pdfExportImageFormat', e.target.value)
          }
        >
          <option value="jpg">jpg</option>
          <option value="png">png</option>
        </select>
      </SettingItem>
      <SettingItem name="Image Quality (jpg only)">
        <input
          min="0"
          max="100"
          onChange={(e) =>
            updateSetting('pdfExportImageQuality', Number(e.target.value))
          }
          type="number"
          defaultValue={settings.pdfExportImageQuality}
        />
      </SettingItem>
      <SettingItem name="Image DPI">
        <input
          min="0"
          onChange={(e) =>
            updateSetting('pdfExportImageDPI', Number(e.target.value))
          }
          type="number"
          defaultValue={settings.pdfExportImageDPI}
        />
      </SettingItem>
      <SettingItem
        name="Image OCR"
        description={
          <div>
            Attempt to extract text from images created by rectangle
            annotations. This requires that{' '}
            <a
              href="https://tesseract-ocr.github.io/tessdoc/"
              target="_blank"
              rel="noreferrer"
            >
              tesseract
            </a>{' '}
            be installed on your system. Tesseract can be installed from
            <a href="https://brew.sh/" target="_blank" rel="noreferrer">
              homebrew on mac
            </a>
            , various linux package managers, and from{' '}
            <a
              href="https://github.com/UB-Mannheim/tesseract/wiki"
              target="_blank"
              rel="noreferrer"
            >
              here on windows
            </a>
            .
          </div>
        }
      >
        <div
          onClick={() =>
            setOCRState((s) => {
              updateSetting('pdfExportImageOCR', !s);
              return !s;
            })
          }
          className={`checkbox-container${ocrState ? ' is-enabled' : ''}`}
        />
      </SettingItem>
      <SettingItem
        name="Tesseract path"
        description={
          <div>
            Required: An absolute path to the tesseract executable. This can be
            found on mac and linux with the terminal command{' '}
            <pre>which tesseract</pre>
          </div>
        }
      >
        <input
          onChange={(e) =>
            updateSetting('pdfExportImageTesseractPath', e.target.value)
          }
          type="text"
          defaultValue={settings.pdfExportImageTesseractPath}
        />
      </SettingItem>
      <SettingItem
        name="Image OCR Language"
        description={
          <div>
            Optional: defaults to english. Multiple languages can be specified
            like so: <pre>eng+deu</pre>. Each language must be installed on your
            system.{' '}
            <a
              href="https://github.com/tesseract-ocr/tessdata"
              target="_blank"
              rel="noreferrer"
            >
              Languages can be downloaded here
            </a>
            . (See{' '}
            <a
              href="https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html"
              target="_blank"
              rel="noreferrer"
            >
              here for a description of the language codes
            </a>
            )
          </div>
        }
      >
        <input
          onChange={(e) =>
            updateSetting('pdfExportImageOCRLang', e.target.value)
          }
          type="text"
          defaultValue={settings.pdfExportImageOCRLang}
        />
      </SettingItem>
      <SettingItem
        name="Tesseract data directory"
        description="Optional: supply an absolute path to the directory where tesseract's language files reside."
      >
        <input
          onChange={(e) =>
            updateSetting('pdfExportImageTessDataDir', e.target.value)
          }
          type="text"
          defaultValue={settings.pdfExportImageTessDataDir}
        />
      </SettingItem>
    </>
  );
}

export class ZoteroConnectorSettingsTab extends PluginSettingTab {
  plugin: ZoteroConnector;
  dbTimer: number;

  constructor(app: App, plugin: ZoteroConnector) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    ReactDOM.render(
      <SettingsComponent
        settings={this.plugin.settings}
        addCiteFormat={this.addCiteFormat}
        updateCiteFormat={this.updateCiteFormat}
        removeCiteFormat={this.removeCiteFormat}
        addExportFormat={this.addExportFormat}
        updateExportFormat={this.updateExportFormat}
        removeExportFormat={this.removeExportFormat}
        updateSetting={this.updateSetting}
      />,
      this.containerEl
    );
  }

  addCiteFormat = (format: CitationFormat) => {
    this.plugin.addFormatCommand(format);
    this.plugin.settings.citeFormats.unshift(format);
    this.debouncedSave();

    return this.plugin.settings.citeFormats.slice();
  };

  updateCiteFormat = (index: number, format: CitationFormat) => {
    this.plugin.removeFormatCommand(this.plugin.settings.citeFormats[index]);
    this.plugin.addFormatCommand(format);
    this.plugin.settings.citeFormats[index] = format;
    this.debouncedSave();

    return this.plugin.settings.citeFormats.slice();
  };

  removeCiteFormat = (index: number) => {
    this.plugin.removeFormatCommand(this.plugin.settings.citeFormats[index]);
    this.plugin.settings.citeFormats.splice(index, 1);
    this.debouncedSave();

    return this.plugin.settings.citeFormats.slice();
  };

  addExportFormat = (format: ExportFormat) => {
    this.plugin.addExportCommand(format);
    this.plugin.settings.exportFormats.unshift(format);
    this.debouncedSave();

    return this.plugin.settings.exportFormats.slice();
  };

  updateExportFormat = (index: number, format: ExportFormat) => {
    this.plugin.removeExportCommand(this.plugin.settings.exportFormats[index]);
    this.plugin.addExportCommand(format);
    this.plugin.settings.exportFormats[index] = format;
    this.debouncedSave();

    return this.plugin.settings.exportFormats.slice();
  };

  removeExportFormat = (index: number) => {
    this.plugin.removeExportCommand(this.plugin.settings.exportFormats[index]);
    this.plugin.settings.exportFormats.splice(index, 1);
    this.debouncedSave();

    return this.plugin.settings.exportFormats.slice();
  };

  updateSetting = <T extends keyof ZoteroConnectorSettings>(
    key: T,
    value: ZoteroConnectorSettings[T]
  ) => {
    this.plugin.settings[key] = value;
    this.debouncedSave();
  };

  debouncedSave() {
    clearTimeout(this.dbTimer);
    this.dbTimer = window.setTimeout(() => {
      this.plugin.saveSettings();
    }, 150);
  }

  hide() {
    super.hide();
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }
}
