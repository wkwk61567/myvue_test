import { ref } from "vue";

export function useSelectRow(key) {
  const selectedRow = ref(null); // 當前選取的row

  const selectRow = (item) => {
    // 選取row
    // 使用可選鏈運算子 (?.) 來處理 selectedRow 可能為 null 的情況

    // 如果已選取的row與點擊的row相同, 則取消選取, 否則選取該row
    selectedRow.value = selectedRow.value?.[key] === item[key] ? null : item;
  };

  const isRowSelected = (itemKey) => {
    // 判斷row是否被選取
    if (selectedRow.value === null) {
      return false;
    } else {
      return selectedRow.value[key] === itemKey;
    }
  };

  return { selectedRow, selectRow, isRowSelected };
}
