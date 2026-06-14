export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/tasks/index',
    'pages/notices/index',
    'pages/shopping/index',
    'pages/mine/index',
    'pages/task-detail/index',
    'pages/create-task/index',
    'pages/create-notice/index',
    'pages/calendar/index',
    'pages/report/index',
    'pages/family-manage/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF7A45',
    navigationBarTitleText: '家庭共享',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF8F3'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#FF7A45',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/tasks/index',
        text: '任务'
      },
      {
        pagePath: 'pages/notices/index',
        text: '公告'
      },
      {
        pagePath: 'pages/shopping/index',
        text: '购物'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
