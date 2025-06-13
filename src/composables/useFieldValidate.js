// 用來驗證欄位是否已填寫正確

import { ref, computed, watch } from "vue";

export function useFieldValidate(results, form, formRows, fieldRefs, labels) {
  // 聚焦機制狀態
  const focusedItem = ref(null); // 用來存儲當前聚焦的行
  const focusedField = ref(null); // 用來存儲當前聚焦的欄位
  const isFocusMechanismActive = ref(false); // 用來標記聚焦機制是否啟動

  const fieldsRequired = computed(() => {
    const fieldsArray = [];
    for (const key in labels) {
      if (key.startsWith("header.") && labels[key].isAllowBlank !== true) {
        fieldsArray.push(key);
      }
    }
    return fieldsArray;
  }); // 表格中的必填欄位

  function getElementRef(item, field) {
    const refName = `field_${item["NA.cldhditm.id"]}_${field}`;
    //`field_${focusedItem["NA.cldhditm.id"]}_${focusedField}`
    const elementRef = fieldRefs[refName];
    // refs 可能是陣列（如果有重複的 ref）或單個元素
    if (Array.isArray(elementRef)) {
      console.error(
        `找到多個元素引用: ${refName}，請檢查是否有重複的 ref 名稱`
      );
      return elementRef[0]?.$el?.querySelector("input") || elementRef[0]?.$el;
    } else {
      return elementRef?.$el?.querySelector("input") || elementRef?.$el;
    }
  }

  function isFieldValid(fieldValue, field) {
    // 驗證某個欄位是否已填有效值

    if (labels[field].validationRule === "nonEmptyString") {
      // 如果是非空字串，則檢查是否為空
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue.trim() !== ""
      );
    } else if (labels[field].validationRule === "number") {
      // 如果是數字，則檢查是否為有效數字
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        !isNaN(parseFloat(fieldValue)) &&
        isFinite(fieldValue)
      );
    } else if (labels[field].validationRule === "positive") {
      // 如果是正數，則檢查是否為有效正數
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        !isNaN(parseFloat(fieldValue)) &&
        isFinite(fieldValue) &&
        parseFloat(fieldValue) > 0
      );
    } else if (labels[field].validationRule === "atLeastOnePositive") {
      // 檢查至少有一個欄位是正數
      return true; // 這個驗證規則在行級別處理(isRowFieldsValid)
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        !isNaN(parseFloat(fieldValue)) &&
        isFinite(fieldValue) &&
        parseFloat(fieldValue) > 0
      );
    } else if (labels[field].validationRule === "date") {
      // 如果是日期，則檢查是否為有效日期
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== "" &&
        !isNaN(Date.parse(fieldValue))
      );
    } else if (labels[field].validationRule === "dateNotAfterToday") {
      // 檢查日期是否不在今天之後（只允許今天或今天之前的日期）
      const today = new Date();
      const inputDate = new Date(fieldValue);
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== "" &&
        !(inputDate > today)
      );
    } else {
      // 如果沒有特定的驗證規則，則默認視為有效
      return true;
    }
  }

  function isRowFieldsValid(item) {
    // 驗證某一行需要檢查的欄位是否都已填有效值
    if (
      fieldsRequired.value.every((field) => {
        return isFieldValid(item[field], field);
      })
    ) {
      const groups = {};
      for (const field in labels) {
        if (labels[field].validationRule === "atLeastOnePositive") {
          const groupName = labels[field].validationGroup;
          if (!groupName) {
            console.error(
              `欄位 ${field} 的 validationRule 是 "atLeastOnePositive" 但缺少 validationGroup`
            );
            continue; // 跳過沒有分組的欄位
          }
          if (!groups[groupName]) {
            groups[groupName] = [];
          }
          groups[groupName].push(field);
        }
      }

      // 檢查每個分組是否至少有一個正數
      for (const groupName in groups) {
        const fieldsInGroup = groups[groupName];
        const isGroupValid = fieldsInGroup.some((field) => {
          const fieldValue = item[field];
          return (
            fieldValue !== undefined &&
            fieldValue !== null &&
            !isNaN(parseFloat(fieldValue)) &&
            isFinite(fieldValue) &&
            parseFloat(fieldValue) > 0
          );
        });
        if (!isGroupValid) {
          return false; // 如果任何一個分組無效，則整行無效
        }
      }
      return true; // 所有基本驗證通過，且所有 "atLeastOnePositive" 分組都有效
    } else {
      return false;
    }
  }

  const isAnyFieldInvalid = computed(() => {
    // 檢查是否有任一行欄位未填寫
    return results.value.some((item) => !isRowFieldsValid(item));
  });

  function focusNextInvalidField(item) {
    // 尋找下一個無效欄位並聚焦

    // 先檢查當前行中的後續欄位
    const currentItemIndex = results.value.indexOf(item);
    if (currentItemIndex !== -1) {
      // 檢查當前行中的欄位
      for (let i = 0; i < fieldsRequired.value.length; i++) {
        const nextField = fieldsRequired.value[i];
        if (!isFieldValid(item[nextField], nextField)) {
          // 找到了當前行中的下一個無效欄位
          const elementRef = getElementRef(item, nextField);
          if (elementRef) {
            deactivateFocusMechanism();
            activateFocusMechanism(item, nextField, elementRef);
            return;
          }
        }
      }
      /*
      // 檢查後續行
      for (
        //let rowIndex = currentItemIndex + 1;
        let rowIndex = 0;
        rowIndex < results.value.length;
        rowIndex++
      ) {
        const nextRow = results.value[rowIndex];

        for (let i = 0; i < fieldsRequired.value.length; i++) {
          const field = fieldsRequired.value[i];

          if (!isFieldValid(nextRow[field], field)) {
            // 找到了後續行中的無效欄位
            const elementRef = getElementRef(nextRow, field);

            if (elementRef) {
              deactivateFocusMechanism();
              activateFocusMechanism(nextRow, field, elementRef);
              return;
            }
          }
        }
      }*/
    }
    deactivateFocusMechanism();
    return; // 沒有找到更多需要聚焦的欄位
  }

  function activateFocusMechanism(item, field, elementRef) {
    // 啟動聚焦機制
    if (isFocusMechanismActive.value) {
      return; // 如果已經啟動，則不再重複啟動
    }

    focusedItem.value = item;
    focusedField.value = field;
    isFocusMechanismActive.value = true;
    console.log("聚焦機制啟動:", field);
    // 確保元素存在並聚焦它
    if (elementRef && elementRef.focus) {
      setTimeout(() => {
        console.log("聚焦到元素:", elementRef);
        elementRef.focus();
      }, 0);
    } else {
      console.error(`無法聚焦到元素: ${field}，可能是元素不存在或未正確引用`);
    }
  }

  function deactivateFocusMechanism() {
    // 解除聚焦機制
    focusedItem.value = null;
    focusedField.value = null;
    isFocusMechanismActive.value = false;
  }

  function handleFocus(item, field, elementRef) {
    // 處理欄位獲得焦點事件
    if (!isFieldValid(item[field], field)) {
      activateFocusMechanism(item, field, elementRef);
    }
  }

  function handleBlur(item, field, elementRef) {
    // 處理欄位失去焦點事件

    // 填完之後可以反悔，回去填原本的欄位(必須在fieldsRequired.value的順序更前面)
    if (
      isFocusMechanismActive.value &&
      fieldsRequired.value.indexOf(field) <
        fieldsRequired.value.indexOf(focusedField.value)
    ) {
      console.log(`欄位 ${field} 反悔`);
      deactivateFocusMechanism();
      activateFocusMechanism(item, field, elementRef);
      return;
    }

    if (!isFocusMechanismActive.value && !isFieldValid(item[field], field)) {
      activateFocusMechanism(item, field, elementRef);
    }

    if (
      isFocusMechanismActive.value &&
      focusedItem.value === item &&
      focusedField.value === field
    ) {
      if (isFieldValid(item[field], field)) {
        // 欄位有效，解除聚焦機制
        //deactivateFocusMechanism();

        // 如果有其他欄位需要聚焦，則聚焦到下一個欄位
        focusNextInvalidField(item);
      } else {
        // 欄位無效，重新聚焦
        if (elementRef && elementRef.focus) {
          setTimeout(() => {
            elementRef.focus();
          }, 0);
        }
      }
    }
  }

  function isFieldDisabled(item, field) {
    // 檢查是否應該禁用欄位
    return (
      isFocusMechanismActive.value &&
      !(focusedItem.value === item && focusedField.value === field)
    );
  }

  // 如果當前聚焦的行被刪除，則解除聚焦機制
  watch(
    results,
    () => {
      // 只有在聚焦機制啟動時才進行檢查
      if (isFocusMechanismActive.value === true) {
        const refName = `field_${focusedItem.value["NA.cldhditm.id"]}_${focusedField.value}`;

        // 檢查 results 中是否存在對應的 focusedItem
        if (!results.value.includes(focusedItem.value)) {
          console.log(`欄位不存在: ${refName}，解除聚焦機制`);
          deactivateFocusMechanism();
        }
      }
    },
    { deep: true }
  );

  function isFormError(mode, field, value) {
    // 檢查表單欄位是否要顯示錯誤(view模式下不檢查)
    return (
      mode !== "view" &&
      !(
        field.inputType === "fixed" ||
        (field.inputType === "optional" &&
          !(
            field.componentType === "icon-text-field" ||
            field.componentType === "select"
          ))
      ) &&
      !field.isAllowBlank &&
      (value === null || value === "")
    );
  }

  const isFormComplete = computed(() => {
    // 檢查form的欄位是否有空值
    for (let row of formRows) {
      for (let field of row) {
        if (
          !field.isAllowBlank &&
          (form[field.column] === null || form[field.column] === "")
        ) {
          return false; // 有空值，返回false
        }
      }
    }
    return true; // 所有欄位都有值，返回true
  });

  return {
    isFieldValid,
    isRowFieldsValid,
    isAnyFieldInvalid,
    handleFocus,
    handleBlur,
    isFieldDisabled,
    focusNextInvalidField,
    isFocusMechanismActive,
    isFormError,
    isFormComplete,
  };
}
