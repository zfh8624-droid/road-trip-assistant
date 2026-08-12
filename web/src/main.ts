import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Vant 按需引入
import {
  Tabbar,
  TabbarItem,
  Button,
  Icon,
  ActionSheet,
  Popup,
  Field,
  Picker,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Radio,
  Toast,
  Dialog,
  Swipe,
  SwipeItem,
  Card,
  Tag,
  Cell,
  CellGroup,
  Overlay,
  Image as VanImage,
  Empty,
  NavBar,
  ShareSheet,
  Notify,
  Loading,
  Stepper,
  Search,
  Divider,
  Grid,
  GridItem,
  Sticky,
  Progress,
  Collapse,
  CollapseItem,
  Uploader,
  Skeleton,
  Tab,
  Tabs,
  IndexBar,
  IndexAnchor,
  List,
  PullRefresh,
  ActionBar,
  ActionBarIcon,
  ActionBarButton,
  DropdownMenu,
  DropdownItem,
  SwipeCell,
  Badge,
  Circle,
  CountDown,
  Steps,
  Step,
  NoticeBar,
  Pagination,
  PasswordInput,
  NumberKeyboard,
  Slider,
  Switch,
  Rate,
  Area,
  Calendar,
  Cascader,
  CouponCell,
  CouponList,
  ContactCard,
  ContactEdit,
  ContactList,
  SubmitBar,
  AddressEdit,
  AddressList,
  Lazyload,
  ConfigProvider,
  FloatingBubble,
  FloatingPanel,
  RollingText,
  Barrage,
  BackTop,
  ImagePreview,
  Signature,
  Watermark,
  TextEllipsis,
  Highlight
} from 'vant'

import 'vant/lib/index.css'

const app = createApp(App)

// 注册 Vant 组件
const vantComponents = [
  Tabbar, TabbarItem, Button, Icon, ActionSheet, Popup, Field, Picker,
  Checkbox, CheckboxGroup, RadioGroup, Radio, Toast, Dialog, Swipe, SwipeItem,
  Card, Tag, Cell, CellGroup, Overlay, VanImage, Empty, NavBar, ShareSheet,
  Notify, Loading, Stepper, Search, Divider, Grid, GridItem, Sticky, Progress,
  Collapse, CollapseItem, Uploader, Skeleton, Tab, Tabs, IndexBar, IndexAnchor,
  List, PullRefresh, ActionBar, ActionBarIcon, ActionBarButton, DropdownMenu,
  DropdownItem, SwipeCell, Badge, Circle, CountDown, Steps, Step, NoticeBar,
  Pagination, PasswordInput, NumberKeyboard, Slider, Switch, Rate,
  Area, Calendar, Cascader, CouponCell, CouponList, ContactCard,
  ContactEdit, ContactList, SubmitBar, AddressEdit, AddressList, Lazyload,
  ConfigProvider, FloatingBubble, FloatingPanel, RollingText, Barrage, BackTop,
  ImagePreview, Signature, Watermark, TextEllipsis, Highlight
]
vantComponents.forEach(comp => app.use(comp))

app.use(createPinia())
app.use(router)
app.mount('#app')