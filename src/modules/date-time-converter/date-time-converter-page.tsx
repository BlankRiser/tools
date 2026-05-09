import { GlobalErrorBoundary } from "#/components/common/global-error-boundary";
import { ClockHeader } from "./clock-header";
import { DateInputPanel } from "./date-input-panel";
import { FormatPanel } from "./format-panel";
import { TimezoneComparisonPanel } from "./timezone-comparison-panel";
import { useDateTimeEngine } from "./use-date-time-engine";

export function DateTimeConverterPage() {
  const {
    effectiveDate,
    systemTimezone,
    systemOffset,
    utcDisplay,
    timezoneData,
    displayFormat,
    customFormat,
    inputValue,
    inputMode,
    parseError,
    representations,
    handleInputChange,
    handleInputModeChange,
    addTimezone,
    removeTimezone,
    togglePin,
    setDisplayFormat,
    setCustomFormat,
  } = useDateTimeEngine();

  return (
    <GlobalErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-2 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Date Time Converter</h1>
          <p className="mt-2 text-muted-foreground">Convert dates across timezones and UTC with flexible formatting options.</p>
        </div>

        <ClockHeader effectiveDate={effectiveDate} systemTimezone={systemTimezone} systemOffset={systemOffset} utcDisplay={utcDisplay} />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <DateInputPanel
              inputValue={inputValue}
              inputMode={inputMode}
              parseError={parseError}
              representations={representations}
              onInputChange={handleInputChange}
              onModeChange={handleInputModeChange}
            />

            <FormatPanel
              displayFormat={displayFormat}
              customFormat={customFormat}
              effectiveDate={effectiveDate}
              onFormatChange={setDisplayFormat}
              onCustomFormatChange={setCustomFormat}
            />
          </div>

          <div className="flex flex-col gap-6">
            <TimezoneComparisonPanel
              timezoneData={timezoneData}
              userTimezone={systemTimezone}
              onAdd={addTimezone}
              onRemove={removeTimezone}
              onTogglePin={togglePin}
            />
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}
