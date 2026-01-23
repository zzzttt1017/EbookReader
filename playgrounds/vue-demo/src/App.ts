import { defineComponent, h, ref } from 'vue'
import { EBookReaderVue } from '@somecat/ebook-reader/vue'
import '@somecat/ebook-reader/style.css'
import './app.css'

export default defineComponent({
  name: 'App',
  setup() {
    const file = ref<File | null>(null)

    return () =>
      h('div', { class: 'app' }, [
        h('header', { class: 'app__header' }, [
          h('input', {
            type: 'file',
            accept: '.epub',
            onChange: (e: any) => {
              file.value = e?.target?.files?.[0] ?? null
            },
          }),
          h('span', { class: 'app__file' }, file.value?.name ?? '未选择文件'),
        ]),
        h('main', { class: 'app__main' }, [h(EBookReaderVue, { file: file.value })]),
      ])
  },
})
