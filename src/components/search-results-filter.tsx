"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ContentItem } from "@screenpipe/browser";

interface SearchResultsFilterProps {
  results: ContentItem[];
  onFilteredResultsChange: (filteredResults: ContentItem[]) => void;
  className?: string;
}

type FilterCriteria = {
  contentType: string[];
  appName: string;
  windowName: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  textContent: string;
  hasVideo: boolean | null;
};

export function SearchResultsFilter({
  results,
  onFilteredResultsChange,
  className,
}: SearchResultsFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    contentType: [],
    appName: "",
    windowName: "",
    dateRange: {
      start: null,
      end: null,
    },
    textContent: "",
    hasVideo: null,
  });
  const [availableAppNames, setAvailableAppNames] = useState<string[]>([]);
  const [availableWindowNames, setAvailableWindowNames] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Extract unique app and window names from results
  useEffect(() => {
    if (results.length > 0) {
      const appNames = new Set<string>();
      const windowNames = new Set<string>();

      results.forEach((item) => {
        if (item.type === "OCR" && item.content.appName) {
          appNames.add(item.content.appName);
        }
        if (item.type === "OCR" && item.content.windowName) {
          windowNames.add(item.content.windowName);
        }
      });

      setAvailableAppNames(Array.from(appNames).sort());
      setAvailableWindowNames(Array.from(windowNames).sort());
    }
  }, [results]);

  // Apply filters whenever filter criteria changes
  useEffect(() => {
    applyFilters();
    updateActiveFilters();
  }, [filterCriteria, results]);

  const updateActiveFilters = () => {
    const active: string[] = [];
    
    if (filterCriteria.contentType.length > 0) {
      active.push(`Content Type: ${filterCriteria.contentType.join(", ")}`);
    }
    
    if (filterCriteria.appName) {
      active.push(`App: ${filterCriteria.appName}`);
    }
    
    if (filterCriteria.windowName) {
      active.push(`Window: ${filterCriteria.windowName}`);
    }
    
    if (filterCriteria.dateRange.start || filterCriteria.dateRange.end) {
      const dateStr = [];
      if (filterCriteria.dateRange.start) {
        dateStr.push(`From: ${filterCriteria.dateRange.start.toLocaleDateString()}`);
      }
      if (filterCriteria.dateRange.end) {
        dateStr.push(`To: ${filterCriteria.dateRange.end.toLocaleDateString()}`);
      }
      active.push(`Date: ${dateStr.join(" ")}`);
    }
    
    if (filterCriteria.textContent) {
      active.push(`Text: ${filterCriteria.textContent}`);
    }
    
    if (filterCriteria.hasVideo !== null) {
      active.push(`Has Video: ${filterCriteria.hasVideo ? "Yes" : "No"}`);
    }
    
    setActiveFilters(active);
  };

  const applyFilters = () => {
    let filteredResults = [...results];

    // Filter by content type
    if (filterCriteria.contentType.length > 0) {
      filteredResults = filteredResults.filter((item) =>
        filterCriteria.contentType.includes(item.type)
      );
    }

    // Filter by app name
    if (filterCriteria.appName) {
      filteredResults = filteredResults.filter(
        (item) => 
          item.type === "OCR" && 
          item.content.appName && 
          item.content.appName.toLowerCase().includes(filterCriteria.appName.toLowerCase())
      );
    }

    // Filter by window name
    if (filterCriteria.windowName) {
      filteredResults = filteredResults.filter(
        (item) => 
          item.type === "OCR" && 
          item.content.windowName && 
          item.content.windowName.toLowerCase().includes(filterCriteria.windowName.toLowerCase())
      );
    }

    // Filter by date range
    if (filterCriteria.dateRange.start || filterCriteria.dateRange.end) {
      filteredResults = filteredResults.filter((item) => {
        const timestamp = new Date(item.content.timestamp);
        
        if (filterCriteria.dateRange.start && filterCriteria.dateRange.end) {
          return timestamp >= filterCriteria.dateRange.start && timestamp <= filterCriteria.dateRange.end;
        } else if (filterCriteria.dateRange.start) {
          return timestamp >= filterCriteria.dateRange.start;
        } else if (filterCriteria.dateRange.end) {
          return timestamp <= filterCriteria.dateRange.end;
        }
        
        return true;
      });
    }

    // Filter by text content
    if (filterCriteria.textContent) {
      filteredResults = filteredResults.filter((item) => {
        if (item.type === "OCR") {
          return item.content.text.toLowerCase().includes(filterCriteria.textContent.toLowerCase());
        } else if (item.type === "Audio") {
          return item.content.transcription.toLowerCase().includes(filterCriteria.textContent.toLowerCase());
        } else if (item.type === "UI") {
          return item.content.text.toLowerCase().includes(filterCriteria.textContent.toLowerCase());
        }
        return false;
      });
    }

    // Filter by has video
    if (filterCriteria.hasVideo !== null) {
      filteredResults = filteredResults.filter((item) => {
        const hasFilePath = !!item.content.filePath && item.content.filePath.trim() !== "";
        return filterCriteria.hasVideo ? hasFilePath : !hasFilePath;
      });
    }

    onFilteredResultsChange(filteredResults);
  };

  const handleContentTypeChange = (type: string) => {
    setFilterCriteria((prev) => {
      const newContentType = prev.contentType.includes(type)
        ? prev.contentType.filter((t) => t !== type)
        : [...prev.contentType, type];
      
      return {
        ...prev,
        contentType: newContentType,
      };
    });
  };

  const resetFilters = () => {
    setFilterCriteria({
      contentType: [],
      appName: "",
      windowName: "",
      dateRange: {
        start: null,
        end: null,
      },
      textContent: "",
      hasVideo: null,
    });
  };

  const removeFilter = (filter: string) => {
    const filterType = filter.split(":")[0].trim();
    
    setFilterCriteria((prev) => {
      const newCriteria = { ...prev };
      
      switch (filterType) {
        case "Content Type":
          newCriteria.contentType = [];
          break;
        case "App":
          newCriteria.appName = "";
          break;
        case "Window":
          newCriteria.windowName = "";
          break;
        case "Date":
          newCriteria.dateRange = { start: null, end: null };
          break;
        case "Text":
          newCriteria.textContent = "";
          break;
        case "Has Video":
          newCriteria.hasVideo = null;
          break;
      }
      
      return newCriteria;
    });
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-2"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter Results
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
          
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="px-2 py-1">
                {filter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-2"
                  onClick={() => removeFilter(filter)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={resetFilters}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {results.length} total results
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-card border rounded-md p-4 mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Content Type Filter */}
          <div>
            <Label className="mb-2 block">Content Type</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-ocr"
                  checked={filterCriteria.contentType.includes("OCR")}
                  onCheckedChange={() => handleContentTypeChange("OCR")}
                />
                <label htmlFor="filter-ocr" className="text-sm cursor-pointer">
                  OCR (Screen Text)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-audio"
                  checked={filterCriteria.contentType.includes("Audio")}
                  onCheckedChange={() => handleContentTypeChange("Audio")}
                />
                <label htmlFor="filter-audio" className="text-sm cursor-pointer">
                  Audio (Transcriptions)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-ui"
                  checked={filterCriteria.contentType.includes("UI")}
                  onCheckedChange={() => handleContentTypeChange("UI")}
                />
                <label htmlFor="filter-ui" className="text-sm cursor-pointer">
                  UI Elements
                </label>
              </div>
            </div>
          </div>
          
          {/* App Name Filter */}
          <div>
            <Label htmlFor="filter-app-name" className="mb-2 block">
              App Name
            </Label>
            <Select
              value={filterCriteria.appName}
              onValueChange={(value) =>
                setFilterCriteria((prev) => ({ ...prev, appName: value }))
              }
            >
              <SelectTrigger id="filter-app-name">
                <SelectValue placeholder="Select app name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Apps</SelectItem>
                {availableAppNames.map((appName) => (
                  <SelectItem key={appName} value={appName}>
                    {appName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Window Name Filter */}
          <div>
            <Label htmlFor="filter-window-name" className="mb-2 block">
              Window Name
            </Label>
            <Select
              value={filterCriteria.windowName}
              onValueChange={(value) =>
                setFilterCriteria((prev) => ({ ...prev, windowName: value }))
              }
            >
              <SelectTrigger id="filter-window-name">
                <SelectValue placeholder="Select window name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Windows</SelectItem>
                {availableWindowNames.map((windowName) => (
                  <SelectItem key={windowName} value={windowName}>
                    {windowName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Text Content Filter */}
          <div>
            <Label htmlFor="filter-text-content" className="mb-2 block">
              Text Content
            </Label>
            <Input
              id="filter-text-content"
              placeholder="Filter by text content"
              value={filterCriteria.textContent}
              onChange={(e) =>
                setFilterCriteria((prev) => ({
                  ...prev,
                  textContent: e.target.value,
                }))
              }
            />
          </div>
          
          {/* Has Video Filter */}
          <div>
            <Label className="mb-2 block">Has Video</Label>
            <Select
              value={filterCriteria.hasVideo === null ? "" : filterCriteria.hasVideo.toString()}
              onValueChange={(value) =>
                setFilterCriteria((prev) => ({
                  ...prev,
                  hasVideo: value === "" ? null : value === "true",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Reset Button */}
          <div className="flex items-end">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
