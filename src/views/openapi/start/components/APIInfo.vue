<script setup lang="ts">
const props = defineProps<{
  loading: boolean
}>()
const token = defineModel('token', { type: String, required: true })
const reqData = defineModel('reqData', { type: Object, required: true })

const emits = defineEmits(['createApiKey', 'handleUpload', 'selectChange'])
</script>

<template>
  <div class="flex-1 flex flex-col py-6 min-h-0">
    <!-- 描述信息 -->
    <div class="text-base text-gray-700 font-bold">概览</div>
    <div class="text-gray-700 mt-5 leading-5">
      LLMOps API 面向开发者提供的专业技术交互能力，致力于通过 API
      实现开发者更高效更全面的述求，不仅如此，API
      将提供更加灵活的和高精度的模型、工作流、知识库和扩展插件等能力的扩展，让定制化 Agent
      更加的精确、高效和智能。
    </div>
    <div class="text-base text-gray-700 font-bold mt-5">准备工作</div>
    <div class="text-gray-700 mt-4 leading-5">
      在开始之前，您需要创建个人访问令牌，其次需要在 LLMOps 上完成 Agent 的创建与发布。
    </div>
    <div class="text-base text-gray-700 font-bold my-5">请求参数</div>
    <!-- API 参数 -->
    <div class="flex flex-col gap-4 max-h-[calc(100%-260x)] overflow-y-scroll scrollbar-w-none">
      <div class="text-gray-700 font-bold">Header 参数</div>
      <a-card class="rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center mb-2">
            <span class="text-gray-700 font-medium">Authorization</span>

            <span class="text-red-500 ml-0.5">*</span>
            <span
              class="rounded-xs text-[10px] px-1 py-0.5 bg-gray-100 shadow-sm ml-1 text-gray-700 font-medium"
              >string</span
            >
          </div>
          <a-button :loading="loading" size="mini" type="text" @click="emits('createApiKey')"
            >授权</a-button
          >
        </div>
        <div class="flex flex-col w-full">
          <div class="text-xs text-gray-500 mb-3">API 通过访问令牌进行 API 请求的鉴权。</div>
          <a-input v-model="token" placeholder="请输入 Authorization" />
        </div>
      </a-card>
      <div class="text-gray-700 font-bold">
        Body 参数
        <span
          class="rounded-xs text-[10px] px-1 py-0.5 bg-gray-100 shadow-sm ml-1 text-gray-700 font-medium"
          >application/json</span
        >
      </div>
      <a-card class="rounded-lg">
        <div class="">
          <div class="flex items-center mb-2">
            <span class="text-gray-700 font-medium">stream</span>
            <span
              class="rounded-xs text-[10px] px-1 py-0.5 bg-gray-100 shadow-sm ml-1 text-gray-700 font-medium"
              >boolean</span
            >
          </div>
          <div class="flex flex-col w-full">
            <div class="text-xs text-gray-500 mb-3">
              是否启用流式返回。
              <a-typography-paragraph class="text-gray-500 mt-2">
                <ul>
                  <li>
                    true：采用流式响应。 “流式响应”
                    将模型的实时响应提供给客户端，类似打字机效果。你可以实时获取服务端返回的对话、消息事件，并在客户端中同步处理、实时展示，也可以直接在
                    completed 事件中获取智能体最终的回复。
                  </li>
                  <li>
                    false：（默认）采用非流式响应。 “非流式响应”
                    是指响应中仅包含本次对话的状态等元数据。在本次对话处理结束后再查看模型回复等完整响应内容。
                  </li>
                </ul>
              </a-typography-paragraph>
            </div>
            <a-select
              v-model="reqData.stream"
              :default-value="false"
              placeholder="请选择是否开启流式响应..."
              @change="emits('selectChange')"
            >
              <a-option :value="true">true</a-option>
              <a-option :value="false">false</a-option>
            </a-select>
          </div>
        </div>
        <div class="mt-7">
          <div class="flex items-center mb-2">
            <span class="text-gray-700 font-medium">app_id</span>
            <span class="text-red-500 ml-0.5">*</span>
            <span
              class="rounded-xs text-[10px] px-1 py-0.5 bg-gray-100 shadow-sm ml-1 text-gray-700 font-medium"
              >string</span
            >
          </div>
          <div class="flex flex-col w-full">
            <div class="text-xs text-gray-500 mb-3">
              要进行会话聊天的智能体 ID。用于区分归属哪个应用，只有归属应用发布后才能请求该接口。

              <a-tag size="small">app_id</a-tag> 可以在AI应用编辑页面的 URL
              获取，如：http://xxxx/space/apps/ce991a57-97cc-42d9-xxxxx/detail, 其中
              ce991a57-97cc-42d9-xxxxx 就是 app_id。
            </div>
            <a-input v-model="reqData.app_id" placeholder="请输入 app_id" />
          </div>
        </div>
        <div class="mt-7">
          <div class="flex items-center mb-2">
            <span class="text-gray-700 font-medium">query</span>
            <span class="text-red-500 ml-0.5">*</span>
            <span
              class="rounded-xs text-[10px] px-1 py-0.5 bg-gray-100 shadow-sm ml-1 text-gray-700 font-medium"
              >string</span
            >
          </div>
          <div class="flex flex-col w-full">
            <div class="text-xs text-gray-500 mb-3">用户输的的对话内容。</div>
            <a-input v-model="reqData.query" placeholder="请输入 query" />
          </div>
        </div>
        <div class="mt-7">
          <div class="flex items-center mb-2">
            <span class="text-gray-700 font-medium">conversation_id</span>
            <span
              class="rounded-xs text-[10px] px-1 py-0.5 bg-gray-100 shadow-sm ml-1 text-gray-700 font-medium"
              >string</span
            >
          </div>
          <div class="flex flex-col w-full">
            <div class="text-xs text-gray-500 mb-3">
              会话 ID，可以基于特定的会话请求该接口，可以为空，空值表示发起新对话。
            </div>
            <a-input v-model="reqData.conversation_id" placeholder="请输入 conversation_id" />
          </div>
        </div>
        <div class="mt-7">
          <div class="flex items-center mb-2">
            <span class="text-gray-700 font-medium">end_user_id</span>
            <span
              class="rounded-xs text-[10px] px-1 py-0.5 bg-gray-100 shadow-sm ml-1 text-gray-700 font-medium"
              >string</span
            >
          </div>
          <div class="flex flex-col w-full">
            <div class="text-xs text-gray-500 mb-3">
              终端用户 ID，表明是哪个终端用户发起的对话，空值表示新建一个终端用户。
            </div>
            <a-input v-model="reqData.end_user_id" placeholder="请输入 end_user_id" />
          </div>
        </div>
        <div class="mt-7">
          <div class="flex items-center mb-2">
            <span class="text-gray-700 font-medium">image_urls</span>
            <span
              class="rounded-xs text-[10px] px-1 py-0.5 bg-gray-100 shadow-sm ml-1 text-gray-700 font-medium"
              >array[string]</span
            >
          </div>
          <div class="flex flex-col w-full">
            <div class="text-xs text-gray-500 mb-3">
              提供给Agent应用的图片。Agent应用会根据提供的图片进行分解并给出回答。
            </div>
            <a-upload
              v-model="reqData.image_urls"
              draggable
              accept="image/png, image/jpeg, image/jpg"
              :limit="5"
              multiple
              tip="支持png、jpeg、jpg最多可上传5图片，每个图片不超过10MB"
              :custom-request="emits('handleUpload')"
            />
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<style scoped></style>
