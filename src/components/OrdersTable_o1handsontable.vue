<template>
  <div>
    <!-- 搜索和篩選區域 -->
    <div class="filters">
      <div class="filter-row">
        <label>工单号</label>
        <input v-model="gcdnoInput" type="text" />
      </div>
      <div class="filter-row">
        <label>料号</label>
        <input v-model="spnoInput" type="text" />
      </div>
      <div class="filter-row">
        <label>起始日期</label>
        <input v-model="startDateInput" type="date" />
      </div>
      <div class="filter-row">
        <label>终止日期</label>
        <input v-model="endDateInput" type="date" />
      </div>

      <div class="filter-row">
        <span>退料</span>
        <label><input type="radio" value="all" v-model="filterReturnMaterial" />还原</label>
        <label><input type="radio" value="hasReturn" v-model="filterReturnMaterial" />有退料</label>
        <label><input type="radio" value="noReturn" v-model="filterReturnMaterial" />无退料</label>
      </div>

      <div class="filter-row">
        <span>未过账</span>
        <label><input type="radio" value="all" v-model="filterUnposted" />还原</label>
        <label><input type="radio" value="hasUnposted" v-model="filterUnposted" />有未过账</label>
        <label><input type="radio" value="noUnposted" v-model="filterUnposted" />无未过账</label>
      </div>

      <div class="filter-row">
        <span>工单完成度</span>
        <label><input type="radio" value="all" v-model="filterCompletion" />还原</label>
        <label><input type="radio" value="above90" v-model="filterCompletion" />90%以上</label>
        <label><input type="radio" value="below90" v-model="filterCompletion" />未满90%</label>
      </div>

      <div class="filter-actions">
        <button @click="applyFilters">搜索</button>
        <button @click="expandAll">{{ allExpanded ? '全部收起' : '全部展开' }}</button>
        <button @click="exportData">导出数据</button>
      </div>
    </div>

    <!-- Handsontable 表格 -->
    <hot-table
      ref="hotTable"
      :data="tableData"
      :colHeaders="colHeaders"
      :columns="columns"
      :licenseKey="'non-commercial-and-evaluation'"
      :rowHeights="rowHeights"
      @afterOnCellMouseDown="onCellClick"
      style="height:400px;overflow:auto;"
    ></hot-table>

  </div>
</template>

<script>
import axios from "axios";
import * as XLSX from "xlsx";
import { HotTable } from '@handsontable/vue3';
import 'handsontable/dist/handsontable.full.min.css';

export default {
  components: {
    HotTable,
  },
  data() {
    return {
      gcdnoInput: "",
      spnoInput: "",
      startDateInput: "",
      endDateInput: "",
      gcdnoSearch: "",
      spnoSearch: "",
      startDateSearch: "",
      endDateSearch: "",
      filterReturnMaterial: "all",
      filterUnposted: "all",
      filterCompletion: "all",
      expanded: [],
      allExpanded: false,
      orders: [],
      colHeaders: [
        '展開/收起', '工单号', '料号', '工单数', '入库数', '最后登记时间',
        '异常代码', '制造備注', '生管備注', '系统備注', '材料半成品料號', '退料數', '退料时间', '過帳时间'
      ],
      columns: [
        { data: 'expand', readOnly: true },
        { data: 'gcdno', readOnly: true },
        { data: 'spno', readOnly: true },
        { data: 'pcs', readOnly: true },
        { data: 'getpcs', readOnly: true },
        { data: 'timeInput', readOnly: true },
        { data: 'errorCodeI', readOnly: true },
        { data: 'note', readOnly: true },
        { data: 'demo', readOnly: true },
        { data: 'systemNotes', readOnly: true },
        { data: 'clno', readOnly: true },
        { data: 'pcsClno', readOnly: true },
        { data: 'dtime', readOnly: true },
        { data: 'gztime', readOnly: true },
      ],
    };
  },
  mounted() {
    axios.get("http://localhost/api/orders2.php")
      .then((response) => {
        this.orders = this.groupByGcdno(response.data);
        this.$nextTick(() => {
          this.updateTableData();
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  },
  methods: {
    applyFilters() {
      this.gcdnoSearch = this.gcdnoInput;
      this.spnoSearch = this.spnoInput;
      this.startDateSearch = this.startDateInput;
      this.endDateSearch = this.endDateInput;
      this.updateTableData();
    },
    toggleExpand(item) {
      const index = this.expanded.indexOf(item.gcdno);
      if (index === -1) {
        this.expanded.push(item.gcdno);
      } else {
        this.expanded.splice(index, 1);
      }
      this.updateTableData();
    },
    isExpanded(item) {
      return this.expanded.includes(item.gcdno);
    },
    expandAll() {
      if (this.allExpanded) {
        this.expanded = [];
        this.allExpanded = false;
      } else {
        this.expanded = this.filteredOrders
          .filter(order => order.children && order.children.length > 0)
          .map(order => order.gcdno);
        this.allExpanded = true;
      }
      this.updateTableData();
    },
    getTags(order) {
      const tags = [];
      if (order.children && order.children.length > 0) {
        tags.push('#有退料');
      } else {
        tags.push('#無退料');
      }

      if (order.children && order.children.length > 0) {
        const hasUnposted = order.children.some(child => !child.gztime);
        if (hasUnposted) {
          tags.push('#有未過帳');
        } else {
          tags.push('#無未過帳');
        }
      } else {
        tags.push('#無未過帳');
      }

      if (order.pcs > 0) {
        const completionRate = (order.getpcs / order.pcs) * 100;
        if (completionRate >= 90) {
          tags.push('#工單滿足90%');
        } else {
          tags.push('#工單未做夠');
        }
      } else {
        tags.push('#工單未做夠');
      }

      return tags;
    },
    groupByGcdno(data) {
      const groups = {};
      data.forEach((item) => {
        const gcdno = item.gcdno;
        const parentFields = {
          gcdno: item.gcdno,
          spno: item.spno,
          pcs: Number((item.pcs || "").replace(/,/g, "")),
          getpcs: Number((item.getpcs || "").replace(/,/g, "")),
          timeInput: item.timeInput,
          errorCodeI: item.errorCodeI,
          note: item.note,
          demo: item.demo,
          children: []
        };

        const childItem = {
          clno: item.clno,
          pcsClno: item.pcsClno ? Number(item.pcsClno.replace(/,/g, "")) : null,
          dtime: item.dtime ? this.parseDate(item.dtime.date) : null,
          gztime: item.gztime ? this.parseDate(item.gztime.date) : null,
        };

        if (!groups[gcdno]) {
          groups[gcdno] = parentFields;
        }
        if (childItem.clno || childItem.pcsClno || childItem.dtime || childItem.gztime) {
          groups[gcdno].children.push(childItem);
        }
      });
      return Object.values(groups);
    },
    parseDate(dateString) {
      const date = new Date(dateString);
      if (isNaN(date)) return null;
      const year = date.getFullYear();
      const month = (`0${date.getMonth() + 1}`).slice(-2);
      const day = (`0${date.getDate()}`).slice(-2);
      const hours = (`0${date.getHours()}`).slice(-2);
      const minutes = (`0${date.getMinutes()}`).slice(-2);
      const seconds = (`0${date.getSeconds()}`).slice(-2);
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    exportData() {
      const dataToExport = [];
      this.orders.forEach((order) => {
        const parentRow = {
          工单号: order.gcdno,
          料号: order.spno,
          工单数: order.pcs,
          入库数: order.getpcs,
          最后登记时间: order.timeInput,
          异常代码: order.errorCodeI,
          制造備注: order.note,
          生管備注: order.demo,
          系统備注: this.getTags(order).join(' ')
        };
        dataToExport.push(parentRow);

        if (order.children && order.children.length > 0) {
          order.children.forEach(child => {
            const childRow = {
              材料半成品料號: child.clno,
              退料數: child.pcsClno,
              退料时间: child.dtime,
              過帳时间: child.gztime,
            };
            dataToExport.push(childRow);
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport, { skipHeader: false });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "订单数据");
      XLSX.writeFile(workbook, "订单数据.xlsx");
    },
    updateTableData() {
      const displayData = [];
      this.filteredOrders.forEach(order => {
        const tags = this.getTags(order).join(' ');
        // 父行資料
        displayData.push({
          expand: order.children && order.children.length > 0 ? (this.isExpanded(order) ? '▼' : '▶') : '',
          gcdno: order.gcdno,
          spno: order.spno,
          pcs: order.pcs,
          getpcs: order.getpcs,
          timeInput: order.timeInput,
          errorCodeI: order.errorCodeI,
          note: order.note,
          demo: order.demo,
          systemNotes: tags,
          clno: '',
          pcsClno: '',
          dtime: '',
          gztime: ''
        });

        // 展開子行
        if (this.isExpanded(order) && order.children && order.children.length > 0) {
          order.children.forEach(child => {
            displayData.push({
              expand: '',
              gcdno: '',
              spno: '',
              pcs: '',
              getpcs: '',
              timeInput: '',
              errorCodeI: '',
              note: '',
              demo: '',
              systemNotes: '',
              clno: child.clno,
              pcsClno: child.pcsClno,
              dtime: child.dtime,
              gztime: child.gztime
            });
          });
        }
      });

      console.log("displayData:", displayData);  // 第4點：顯示資料內容
      const hot = this.$refs.hotTable.hotInstance;
      if (hot) {
        hot.loadData(displayData);
      }
    },
    onCellClick(event, coords) {
      if (coords.col === 0 && coords.row >= 0) {
        const hot = this.$refs.hotTable.hotInstance;
        const rowData = hot.getSourceDataAtRow(coords.row);
        const gcdno = rowData.gcdno;
        if (gcdno) {
          const order = this.orders.find(o => o.gcdno === gcdno);
          if (order && order.children && order.children.length > 0) {
            this.toggleExpand(order);
          }
        }
      }
    },
  },
  computed: {
    filteredOrders() {
      return this.orders.filter((order) => {
        const orderGcdno = order.gcdno ? String(order.gcdno) : "";
        const orderSpno = order.spno ? String(order.spno) : "";

        const gcdnoMatch = this.gcdnoSearch ? orderGcdno.includes(this.gcdnoSearch) : true;
        const spnoMatch = this.spnoSearch ? orderSpno.includes(this.spnoSearch) : true;

        let dateMatch = true;
        if (this.startDateSearch) {
          const startDate = new Date(this.startDateSearch);
          const orderDate = new Date(order.timeInput);
          dateMatch = dateMatch && orderDate >= startDate;
        }
        if (this.endDateSearch) {
          const endDate = new Date(this.endDateSearch);
          const orderDate = new Date(order.timeInput);
          dateMatch = dateMatch && orderDate <= endDate;
        }

        let returnMaterialMatch = true;
        if (this.filterReturnMaterial === 'hasReturn') {
          returnMaterialMatch = order.children && order.children.length > 0;
        } else if (this.filterReturnMaterial === 'noReturn') {
          returnMaterialMatch = !order.children || order.children.length === 0;
        }

        let unpostedMatch = true;
        if (this.filterUnposted === 'hasUnposted') {
          unpostedMatch = order.children && order.children.length > 0 && order.children.some(child => !child.gztime);
        } else if (this.filterUnposted === 'noUnposted') {
          unpostedMatch = order.children && order.children.length > 0 && order.children.every(child => child.gztime);
        }

        let completionMatch = true;
        if (this.filterCompletion === 'above90') {
          completionMatch = order.pcs > 0 && (order.getpcs / order.pcs) * 100 >= 90;
        } else if (this.filterCompletion === 'below90') {
          completionMatch = order.pcs > 0 && (order.getpcs / order.pcs) * 100 < 90;
        }

        return gcdnoMatch && spnoMatch && dateMatch && returnMaterialMatch && unpostedMatch && completionMatch;
      });
    },
    tableData() {
      // 初始為空, 實際資料由 updateTableData() 載入
      return [];
    },
    rowHeights() {
      return 25;
    }
  },
};
</script>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}
.filter-row {
  display: flex;
  flex-direction: column;
}
.filter-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
</style>
