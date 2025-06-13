import dictionaryCsv from './dictionary.csv';

export async function loadDictionary() {
  return new Promise((resolve) => {
    // 檢查 csv-loader 輸出的數據格式
    console.log('CSV 載入數據:', dictionaryCsv);
    
    // 將 csv-loader 轉換好的數據轉換成我們需要的格式
    const dictionaryData = {};
    
    // 檢查是否是數組格式
    if (Array.isArray(dictionaryCsv)) {
      dictionaryCsv.forEach((dictionaryDataRow) => {
        if (!dictionaryData[dictionaryDataRow.vueFilename]) {
          dictionaryData[dictionaryDataRow.vueFilename] = {};
        }
        if (
          !dictionaryData[dictionaryDataRow.vueFilename][
            dictionaryDataRow.category
          ]
        ) {
          dictionaryData[dictionaryDataRow.vueFilename][
            dictionaryDataRow.category
          ] = {};
        }
        // table 層級檢查
        if (
          !dictionaryData[dictionaryDataRow.vueFilename][
            dictionaryDataRow.category
          ][dictionaryDataRow.table]
        ) {
          dictionaryData[dictionaryDataRow.vueFilename][
            dictionaryDataRow.category
          ][dictionaryDataRow.table] = {};
        }
        // 修改 column 層級的檢查和賦值
        dictionaryData[dictionaryDataRow.vueFilename][
          dictionaryDataRow.category
        ][dictionaryDataRow.table][dictionaryDataRow.column] = {
          "zh-TW": dictionaryDataRow["zh-TW"],
          en: dictionaryDataRow.en,
          vi: dictionaryDataRow.vi,
          order: parseInt(dictionaryDataRow.order) || 0,
          inputType: dictionaryDataRow.inputType || null,
          isEditable: dictionaryDataRow.isEditable || null,
          isAllowBlank: dictionaryDataRow.isAllowBlank || null,
          componentType: dictionaryDataRow.componentType || null,
          cols: dictionaryDataRow.cols || null,
          isSticky: dictionaryDataRow.isSticky || null,
          validationRule: dictionaryDataRow.validationRule || null,
          validationGroup: dictionaryDataRow.validationGroup || null,
          dataType: dictionaryDataRow.dataType || null,
        };
      });
    }
    
    console.log('處理後字典:', dictionaryData);
    resolve(dictionaryData);
  });
}