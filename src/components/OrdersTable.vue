<template>
  <v-container>
    <!-- 搜索表单 -->
    <v-card>
      <v-card-text>
        <v-row>
          <!-- 工单号输入框 -->
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="gcdnoInput"
              label="工单号"
              clearable
            ></v-text-field>
          </v-col>
          <!-- 料号输入框 -->
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="spnoInput"
              label="料号"
              clearable
            ></v-text-field>
          </v-col>
          <!-- 起始日期输入框 -->
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="startDateInput"
              label="起始日期"
              type="date"
            ></v-text-field>
          </v-col>
          <!-- 终止日期输入框 -->
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="endDateInput"
              label="终止日期"
              type="date"
            ></v-text-field>
          </v-col>
        </v-row>

        <!-- 新增的 hashtag 篩選器，橫向排列並縮小間距 -->
        <v-row class="pa-0 ma-0">
          <!-- 退料篩選 -->
          <v-col cols="12" sm="4" md="2" class="pa-1">
            <v-radio-group v-model="filterReturnMaterial" row dense>
              退料
              <v-radio label="还原" value="all"></v-radio>
              <v-radio label="有退料" value="hasReturn"></v-radio>
              <v-radio label="无退料" value="noReturn"></v-radio>
            </v-radio-group>
          </v-col>
          <!-- 退料過帳篩選 -->
          <v-col cols="12" sm="4" md="2" class="pa-1">
            <v-radio-group v-model="filterUnposted" row dense>
              未過帳
              <v-radio label="还原" value="all"></v-radio>
              <v-radio label="有未过账" value="hasUnposted"></v-radio>
              <v-radio label="无未过账" value="noUnposted"></v-radio>
            </v-radio-group>
          </v-col>
          <!-- 工单完成篩選 -->
          <v-col cols="12" sm="4" md="2" class="pa-1">
            <v-radio-group v-model="filterCompletion" row dense>
              工單完成度
              <v-radio label="还原" value="all"></v-radio>
              <v-radio label="90%以上" value="above90"></v-radio>
              <v-radio label="未满90%" value="below90"></v-radio>
            </v-radio-group>
          </v-col>
        <!-- </v-row> -->

        <!-- 操作按钮 -->
        <!-- <v-row> -->
          <v-col cols="12" sm="6" md="3">
            <v-btn color="primary" @click="applyFilters">搜索</v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn color="primary" @click="expandAll">
              {{ allExpanded ? '全部收起' : '全部展开' }}
            </v-btn>
          <!--
          </v-col>
          <v-col cols="12" sm="6" md="3">
          -->
            <v-btn color="primary" @click="exportData">导出数据</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 数据表格 -->
    <v-data-table
      :headers="headers"
      :items="filteredOrders"
      item-key="gcdno"
      class="elevation-1"
      :items-per-page="-1"
    >
      <!-- 渲染父级行 -->
      <template #item="{ item }">
        <tr>
          <!-- 展开/收起按钮列 -->
          <td>
            <v-icon
              @click="toggleExpand(item)"
              class="cursor-pointer"
            >
              {{ isExpanded(item) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
            </v-icon>
          </td>
          <!-- 其他数据列 -->
          <td>{{ item.gcdno }}</td>
          <td>{{ item.spno }}</td>
          <td class="text-end">{{ formatNumber(item.pcs) }}</td>
          <td class="text-end">{{ formatNumber(item.getpcs) }}</td>
          <td>{{ item.timeInput }}</td>
          <td>{{ item.errorCodeI }}</td>
          <td>{{ item.note }}</td>
          <td>{{ item.demo }}</td>
          <!-- 新增的 系统备注 列 -->
          <td>
            <div>
              <!-- text-color好像加了flat才有效  -->
              <v-chip
                v-for="tag in getTags(item)"
                :key="tag"
                small
                variant="flat"
                :color="getTagColor(tag)"
                :text-color="getTagTextColor(tag)"
                class="ma-1"
              >
                {{ tag }}
              </v-chip>
            </div>
          </td>
        </tr>
        <!-- 渲染子级行 -->
        <tr v-if="isExpanded(item) && item.children && item.children.length > 0">
          <td colspan="10">
            <v-data-table
              :headers="childHeaders"
              :items="item.children"
              hide-default-footer
              class="ml-4"
            >
              <template #item="{ item }">
                <tr>
                  <td>{{ item.clno }}</td>
                  <td class="text-end">{{ formatNumber(item.pcsClno) }}</td>
                  <td>{{ item.dtime }}</td>
                  <td>{{ item.gztime }}</td>
                </tr>
              </template>
            </v-data-table>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import axios from "axios";
import * as XLSX from "xlsx";

export default {
  data() {
    return {
      // 输入框绑定的值
      gcdnoInput: "",
      spnoInput: "",
      startDateInput: "",
      endDateInput: "",

      // 用于过滤的变量
      gcdnoSearch: "",
      spnoSearch: "",
      startDateSearch: "",
      endDateSearch: "",

      // 新增的篩選條件
      filterReturnMaterial: "all", // "all", "hasReturn", "noReturn"
      filterUnposted: "all",       // "all", "hasUnposted", "noUnposted"
      filterCompletion: "all",     // "all", "above90", "below90"

      expanded: [], // 用于管理展开的行
      allExpanded: false, // 全部展开/收起状态

      // 表头定义，使用 'title' 和 'key'
      headers: [
        { title: '退料明細', key: 'expand', align: 'start', sortable: false },
        { title: '工单号', key: 'gcdno', align: 'start' },
        { title: '料号', key: 'spno', align: 'start' },
        { title: '工单数', key: 'pcs', align: 'end' },
        { title: '入库数', key: 'getpcs', align: 'end' },
        { title: '最后登记时间', key: 'timeInput', align: 'start' },
        { title: '异常代码', key: 'errorCodeI', align: 'start' },
        { title: '制造備注', key: 'note', align: 'start' },      // 修改后的列名
        { title: '生管備注', key: 'demo', align: 'start' },      // 修改后的列名
        { title: '系统備注', key: 'systemNotes', align: 'start', sortable: false }, // 修改后的列名
      ],
      childHeaders: [
        { title: '材料半成品料號', key: 'clno', align: 'start' },
        { title: '退料數', key: 'pcsClno', align: 'end' },
        { title: '退料时间', key: 'dtime', align: 'start' },
        { title: '過帳时间', key: 'gztime', align: 'start' },
      ],

      // 原始订单数据
      orders: [],
    };
  },
  mounted() {
    axios
      .get("http://localhost/api/orders2.php")
      .then((response) => {
        // 预处理数据，将订单按 gcdno 分组
        const groupedOrders = this.groupByGcdno(response.data);
        this.orders = groupedOrders;
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
      // 觸發重新計算 filteredOrders
    },
    formatNumber(value) {
      if (value == null) return "";
      const number = Number(value);
      return number.toLocaleString();
    },
    toggleExpand(item) {
      const index = this.expanded.indexOf(item.gcdno);
      if (index === -1) {
        this.expanded.push(item.gcdno);
      } else {
        this.expanded.splice(index, 1);
      }
    },
    isExpanded(item) {
      return this.expanded.includes(item.gcdno);
    },
    expandAll() {
      if (this.allExpanded) {
        // 收起所有
        this.expanded = [];
        this.allExpanded = false;
      } else {
        // 展开所有
        this.expanded = this.filteredOrders
          .filter(order => order.children && order.children.length > 0)
          .map((order) => order.gcdno);
        this.allExpanded = true;
      }
    },
    getTags(order) {
      const tags = [];

      // 1. 有退料
      if (order.children && order.children.length > 0) {
        tags.push('#有退料');
      } else {
        tags.push('#無退料');
      }

      // 2. 有未過帳
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

      // 3. 工单完成90%以上
      if (order.pcs > 0) { // 避免除以零
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
    getTagColor(tag) {
      if (tag === '#有未過帳') {
        return 'yellow'; // 使用 Vuetify 顏色
      }
      return 'grey'; 
    },
    getTagTextColor(tag) {
      if (tag === '#有未過帳') {
        return 'black';
      }
      return 'white';
    },
    groupByGcdno(data) {
      const groups = {};
      data.forEach((item) => {
        const gcdno = item.gcdno;

        // 提取父级字段
        const parentFields = {
          gcdno: item.gcdno,
          spno: item.spno,
          pcs: Number(item.pcs.replace(/,/g, "")),
          getpcs: Number(item.getpcs.replace(/,/g, "")),
          timeInput: item.timeInput,
          errorCodeI: item.errorCodeI,
          note: item.note,
          demo: item.demo,
          children: [],
        };

        // 提取子级字段
        const childItem = {
          clno: item.clno,
          pcsClno: item.pcsClno
            ? Number(item.pcsClno.replace(/,/g, ""))
            : null,
          dtime: item.dtime ? this.parseDate(item.dtime.date) : null,
          gztime: item.gztime ? this.parseDate(item.gztime.date) : null,
        };

        if (!groups[gcdno]) {
          groups[gcdno] = parentFields;
        }

        // 如果子级数据的关键字段存在，才添加到 children
        if (
          childItem.clno ||
          childItem.pcsClno ||
          childItem.dtime ||
          childItem.gztime
        ) {
          groups[gcdno].children.push(childItem);
        }
      });
      return Object.values(groups);
    },
    parseDate(dateString) {
      // 将日期字符串格式化为 'YYYY-MM-DD HH:mm:ss'
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
      // 将数据转换为适合导出的格式
      const dataToExport = [];

      this.orders.forEach((order) => {
        // 父级数据
        const parentRow = {
          工单号: order.gcdno,
          料号: order.spno,
          工单数: order.pcs,
          入库数: order.getpcs,
          最后登记时间: order.timeInput,
          异常代码: order.errorCodeI,
          制造備注: order.note, // 修改后的列名
          生管備注: order.demo, // 修改后的列名
          系统備注: this.getTags(order).join(' '), // 将标签合并为一个字符串
        };

        dataToExport.push(parentRow);

        // 子级数据
        if (order.children && order.children.length > 0) {
          order.children.forEach((child) => {
            const childRow = {
              材料半成品料號: child.clno,
              退料数量: child.pcsClno,
              退料單輸入时间: child.dtime,
              過帳时间: child.gztime,
            };
            dataToExport.push(childRow);
          });
        }
      });

      // 创建工作簿和工作表
      const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
        skipHeader: false,
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "订单数据");

      // 导出文件
      XLSX.writeFile(workbook, "订单数据.xlsx");
    },
  },
  computed: {
    filteredOrders() {
      return this.orders.filter((order) => {
        const orderGcdno = order.gcdno ? String(order.gcdno) : "";
        const orderSpno = order.spno ? String(order.spno) : "";

        const gcdnoMatch = this.gcdnoSearch
          ? orderGcdno.includes(this.gcdnoSearch)
          : true;
        const spnoMatch = this.spnoSearch
          ? orderSpno.includes(this.spnoSearch)
          : true;

        // 日期过滤逻辑
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

        // 新增的 hashtag 篩選邏輯
        // 1. 退料篩選
        let returnMaterialMatch = true;
        if (this.filterReturnMaterial === 'hasReturn') {
          returnMaterialMatch = order.children && order.children.length > 0;
        } else if (this.filterReturnMaterial === 'noReturn') {
          returnMaterialMatch = !order.children || order.children.length === 0;
        }

        // 2. 退料過帳篩選
        let unpostedMatch = true;
        if (this.filterUnposted === 'hasUnposted') {
          unpostedMatch = order.children && order.children.length > 0 && order.children.some(child => !child.gztime);
        } else if (this.filterUnposted === 'noUnposted') {
          unpostedMatch = order.children && order.children.length > 0 && order.children.every(child => child.gztime);
        }

        // 3. 工单完成篩選
        let completionMatch = true;
        if (this.filterCompletion === 'above90') {
          completionMatch = order.pcs > 0 && (order.getpcs / order.pcs) * 100 >= 90;
        } else if (this.filterCompletion === 'below90') {
          completionMatch = order.pcs > 0 && (order.getpcs / order.pcs) * 100 < 90;
        }

        return gcdnoMatch && spnoMatch && dateMatch && returnMaterialMatch && unpostedMatch && completionMatch;
      });
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.ma-1 {
  margin: 0.25rem;
}
.pa-1 {
  padding: 0.1rem;
}
.v-radio-group {
  margin: 0;
}
.v-radio {
  margin-right: 0.5rem;
}
</style>
