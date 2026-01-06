<script setup lang="ts">
const addNode = (nodeType: string) => {}
</script>

<template>
  <div
    class="flex flex-col gap-2 px-2 py-3 bg-white rounded-lg shadow-sm border border-gray-200 w-[320px]"
  >
    <div class="flex gap-2">
      <!-- 开始节点 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-blue-700 rounded-lg">
                <icon-home />
              </a-avatar>
              <div class="text-gray-700 font-semibold">开始节点</div>
            </div>
            <div class="text-gray-500 text-xs">
              工作流的起始节点，支持定义工作流的起点输入等信息。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('start')"
        >
          <a-avatar shape="square" :size="24" class="bg-blue-700 rounded-lg">
            <icon-home />
          </a-avatar>
          <div class="text-gray-700 font-semibold">开始节点</div>
        </div>
      </a-popover>
      <!-- 结束节点 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-red-700 rounded-lg">
                <icon-filter />
              </a-avatar>
              <div class="text-gray-700 font-semibold">结束节点</div>
            </div>
            <div class="text-gray-500 text-xs">
              工作流的结束节点，支持定义工作流最终输出的变量等信息。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('end')"
        >
          <a-avatar shape="square" :size="24" class="bg-red-700 rounded-lg">
            <icon-filter />
          </a-avatar>
          <div class="text-gray-700 font-semibold">结束节点</div>
        </div>
      </a-popover>
    </div>
    <div class="flex gap-2">
      <!-- 大语言模型节点 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-sky-500 rounded-lg">
                <icon-language />
              </a-avatar>
              <div class="text-gray-700 font-semibold">大语言模型</div>
            </div>
            <div class="text-gray-500 text-xs">调用大语言模型，根据输入参数和提示词生成回复。</div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('llm')"
        >
          <a-avatar shape="square" :size="24" class="bg-sky-500 rounded-lg">
            <icon-language />
          </a-avatar>
          <div class="text-gray-700 font-semibold">大语言模型</div>
        </div>
      </a-popover>
      <!-- 扩展插件 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-orange-500 rounded-lg">
                <icon-tool />
              </a-avatar>
              <div class="text-gray-700 font-semibold">扩展插件</div>
            </div>
            <div class="text-gray-500 text-xs">
              添加插件广场内或自定义API插件，支持能力扩展和复用。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('tool')"
        >
          <a-avatar shape="square" :size="24" class="bg-orange-500 rounded-lg">
            <icon-tool />
          </a-avatar>
          <div class="text-gray-700 font-semibold">扩展插件</div>
        </div>
      </a-popover>
    </div>
    <div class="flex gap-2">
      <!-- 知识库检索 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-violet-500 rounded-lg">
                <icon-storage />
              </a-avatar>
              <div class="text-gray-700 font-semibold">知识库检索</div>
            </div>
            <div class="text-gray-500 text-xs">
              根据输入的参数，在选定的知识库中检索相关片段并召回，返回切片列表。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('dataset_retrieval')"
        >
          <a-avatar shape="square" :size="24" class="bg-violet-500 rounded-lg">
            <icon-storage />
          </a-avatar>
          <div class="text-gray-700 font-semibold">知识库检索</div>
        </div>
      </a-popover>
      <!-- 模板转换 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-emerald-400 rounded-lg">
                <icon-branch />
              </a-avatar>
              <div class="text-gray-700 font-semibold">模板转换</div>
            </div>
            <div class="text-gray-500 text-xs">对多个字符串变量的格式进行处理。</div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('template_transform')"
        >
          <a-avatar shape="square" :size="24" class="bg-emerald-400 rounded-lg">
            <icon-branch />
          </a-avatar>
          <div class="text-gray-700 font-semibold">模板转换</div>
        </div>
      </a-popover>
    </div>
    <div class="flex gap-2">
      <!-- 意图识别节点 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-green-700 rounded-lg">
                <icon-mind-mapping />
              </a-avatar>
              <div class="text-gray-700 font-semibold">意图识别</div>
            </div>
            <div class="text-gray-500 text-xs">
              定义用户问题的分类条件，LLM能够根据分类描述执行不同的分支。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('question_classifier')"
        >
          <a-avatar shape="square" :size="24" class="bg-green-700 rounded-lg">
            <icon-mind-mapping />
          </a-avatar>
          <div class="text-gray-700 font-semibold">意图识别</div>
        </div>
      </a-popover>
      <!-- 迭代节点 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-pink-700 rounded-lg">
                <icon-sync />
              </a-avatar>
              <div class="text-gray-700 font-semibold">迭代节点</div>
            </div>
            <div class="text-gray-500 text-xs">
              传递一个列表型数据，并引用一个工作流完成多轮迭代得到处理后的列表数据。
            </div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('iteration')"
        >
          <a-avatar shape="square" :size="24" class="bg-pink-700 rounded-lg">
            <icon-sync />
          </a-avatar>
          <div class="text-gray-700 font-semibold">迭代节点</div>
        </div>
      </a-popover>
    </div>
    <div class="flex gap-2">
      <!-- HTTP请求 -->
      <a-popover position="lt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-rose-500 rounded-lg">
                <icon-link />
              </a-avatar>
              <div class="text-gray-700 font-semibold">HTTP请求</div>
            </div>
            <div class="text-gray-500 text-xs">配置外部API服务，并发起请求。</div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('http_request')"
        >
          <a-avatar shape="square" :size="24" class="bg-rose-500 rounded-lg">
            <icon-link />
          </a-avatar>
          <div class="text-gray-700 font-semibold">HTTP请求</div>
        </div>
      </a-popover>
      <!-- 代码执行 -->
      <a-popover position="rt" :show-arrow="false">
        <template #content>
          <div class="flex flex-col gap-2 w-[160px]">
            <div class="flex items-center gap-1">
              <a-avatar shape="square" :size="24" class="bg-cyan-500 rounded-lg">
                <icon-code />
              </a-avatar>
              <div class="text-gray-700 font-semibold">代码执行</div>
            </div>
            <div class="text-gray-500 text-xs">编写代码处理输入输出变量来生成返回值。</div>
          </div>
        </template>
        <div
          class="flex-1 flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          @click="() => addNode('code')"
        >
          <a-avatar shape="square" :size="24" class="bg-cyan-500 rounded-lg">
            <icon-code />
          </a-avatar>
          <div class="text-gray-700 font-semibold">代码执行</div>
        </div>
      </a-popover>
    </div>
  </div>
</template>

<style scoped></style>
