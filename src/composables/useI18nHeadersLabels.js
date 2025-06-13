import { computed } from "vue";
import dictionary from "@/config.js";

export function useI18nHeadersLabels(selectedLanguage, fileName) {
  const fullDictionary = dictionary.fullDictionary;

  // 該檔案中所有的項目的名稱與properties(特性)
  const labels = computed(() => {
    const result = {};
    if (!fullDictionary[fileName]) return result;
    for (const category in fullDictionary[fileName]) {
      for (const table in fullDictionary[fileName][category]) {
        for (const column in fullDictionary[fileName][category][table]) {
          result[`${category}.${table}.${column}`] = {
            key: `${category}.${table}.${column}`,
            column: column,
            name:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                selectedLanguage.value || selectedLanguage
              ] || column,
            order:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "order"
              ] || 0,
            inputType:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "inputType"
              ] || null,
            isEditable:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "isEditable"
              ] || null,
            isAllowBlank:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "isAllowBlank"
              ] || null,
            componentType:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "componentType"
              ] || null,
            cols:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "cols"
              ] || null,
            isSticky:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "isSticky"
              ] || null,
            validationRule:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "validationRule"
              ] || null,
            validationGroup:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "validationGroup"
              ] || null,
            dataType:
              fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                "dataType"
              ] || null,
          };
        }
      }
    }
    return result;
  });

  // 表格的表頭
  const headers = computed(() => {
    if (!fullDictionary[fileName]) return [];
    let arr = [];
    for (const category in fullDictionary[fileName]) {
      for (const table in fullDictionary[fileName][category]) {
        for (const column in fullDictionary[fileName][category][table]) {
          if (category === "header") {
            arr.push({
              title:
                fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                  selectedLanguage.value || selectedLanguage
                ] || column,
              key: `${category}.${table}.${column}`,
              order:
                fullDictionary[fileName]?.[category]?.[table]?.[column]?.[
                  "order"
                ] || 0,
            });
          }
        }
      }
    }
    arr = arr.sort((a, b) => a.order - b.order);
    arr = arr.map((header) => ({
      title: header.title,
      key: header.key,
    }));
    return arr;
  });

  return { labels, headers };
}
