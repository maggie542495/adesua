
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "gallery_items": {
                  Row: {
                    "alt_text": string | null,"category": string,"created_at": string,"description": string | null,"id": string,"image_path": string,"is_featured": boolean,"sort_order": number,"status": string,"title": string,"updated_at": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"category"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"image_path": string,"is_featured"?: boolean,"sort_order"?: number,"status"?: string,"title": string,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "alt_text"?: string | null,"category"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"image_path"?: string,"is_featured"?: boolean,"sort_order"?: number,"status"?: string,"title"?: string,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "gallery_items_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"admin_invitations": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string | null,"role": Database["public"]['Enums']["admin_role"],"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"email": string,"expires_at": string,"id"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["admin_role"],"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["admin_role"],"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_invitations_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"admin_profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"deactivated_at": string | null,"email": string,"full_name": string | null,"id": string,"last_login_at": string | null,"role": Database["public"]['Enums']["admin_role"],"status": Database["public"]['Enums']["admin_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"deactivated_at"?: string | null,"email": string,"full_name"?: string | null,"id": string,"last_login_at"?: string | null,"role"?: Database["public"]['Enums']["admin_role"],"status"?: Database["public"]['Enums']["admin_status"],"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"deactivated_at"?: string | null,"email"?: string,"full_name"?: string | null,"id"?: string,"last_login_at"?: string | null,"role"?: Database["public"]['Enums']["admin_role"],"status"?: Database["public"]['Enums']["admin_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"ai_usage_logs": {
                  Row: {
                    "action": string,"conversation_id": string | null,"created_at": string,"enquiry_id": string | null,"error": string | null,"id": string,"latency_ms": number | null,"model": string | null,"provider": string | null,"status": string,"tokens_in": number | null,"tokens_out": number | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"conversation_id"?: string | null,"created_at"?: string,"enquiry_id"?: string | null,"error"?: string | null,"id"?: string,"latency_ms"?: number | null,"model"?: string | null,"provider"?: string | null,"status"?: string,"tokens_in"?: number | null,"tokens_out"?: number | null,"user_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"conversation_id"?: string | null,"created_at"?: string,"enquiry_id"?: string | null,"error"?: string | null,"id"?: string,"latency_ms"?: number | null,"model"?: string | null,"provider"?: string | null,"status"?: string,"tokens_in"?: number | null,"tokens_out"?: number | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_usage_logs_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "chatbot_conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ai_usage_logs_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "enquiries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ai_usage_logs_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"article_categories": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"name": string,"slug": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"articles": {
                  Row: {
                    "author_id": string | null,"body": string | null,"category_id": string | null,"cover_image_path": string | null,"created_at": string,"excerpt": string | null,"id": string,"is_featured": boolean,"published_at": string | null,"reading_time_minutes": number | null,"scheduled_at": string | null,"seo_description": string | null,"seo_image_path": string | null,"seo_title": string | null,"slug": string,"status": Database["public"]['Enums']["content_status"],"title": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body"?: string | null,"category_id"?: string | null,"cover_image_path"?: string | null,"created_at"?: string,"excerpt"?: string | null,"id"?: string,"is_featured"?: boolean,"published_at"?: string | null,"reading_time_minutes"?: number | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_image_path"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"title": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string | null,"category_id"?: string | null,"cover_image_path"?: string | null,"created_at"?: string,"excerpt"?: string | null,"id"?: string,"is_featured"?: boolean,"published_at"?: string | null,"reading_time_minutes"?: number | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_image_path"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "articles_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "articles_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "article_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "articles_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_email": string | null,"actor_id": string | null,"created_at": string,"id": string,"ip_hash": string | null,"metadata": NonNullable<Json>,"resource_id": string | null,"resource_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_email"?: string | null,"actor_id"?: string | null,"created_at"?: string,"id"?: string,"ip_hash"?: string | null,"metadata"?: NonNullable<Json>,"resource_id"?: string | null,"resource_type": string
                  }
                  Update: {
                    "action"?: string,"actor_email"?: string | null,"actor_id"?: string | null,"created_at"?: string,"id"?: string,"ip_hash"?: string | null,"metadata"?: NonNullable<Json>,"resource_id"?: string | null,"resource_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_rules": {
                  Row: {
                    "config": NonNullable<Json>,"created_at": string,"enabled": boolean,"id": string,"key": string,"name": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "config"?: NonNullable<Json>,"created_at"?: string,"enabled"?: boolean,"id"?: string,"key": string,"name": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "config"?: NonNullable<Json>,"created_at"?: string,"enabled"?: boolean,"id"?: string,"key"?: string,"name"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_rules_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_runs": {
                  Row: {
                    "created_at": string,"detail": Json | null,"id": string,"resource_id": string | null,"resource_type": string | null,"rule_key": string,"status": string,"trigger_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"detail"?: Json | null,"id"?: string,"resource_id"?: string | null,"resource_type"?: string | null,"rule_key": string,"status": string,"trigger_type": string
                  }
                  Update: {
                    "created_at"?: string,"detail"?: Json | null,"id"?: string,"resource_id"?: string | null,"resource_type"?: string | null,"rule_key"?: string,"status"?: string,"trigger_type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"chatbot_conversations": {
                  Row: {
                    "consent_contact": boolean,"created_at": string,"email": string | null,"ended_at": string | null,"enquiry_id": string | null,"escalated_at": string | null,"id": string,"last_message_at": string,"name": string | null,"pathway_interest": string | null,"phone": string | null,"session_token": string | null,"started_at": string,"status": string,"updated_at": string,"visitor_key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "consent_contact"?: boolean,"created_at"?: string,"email"?: string | null,"ended_at"?: string | null,"enquiry_id"?: string | null,"escalated_at"?: string | null,"id"?: string,"last_message_at"?: string,"name"?: string | null,"pathway_interest"?: string | null,"phone"?: string | null,"session_token"?: string | null,"started_at"?: string,"status"?: string,"updated_at"?: string,"visitor_key": string
                  }
                  Update: {
                    "consent_contact"?: boolean,"created_at"?: string,"email"?: string | null,"ended_at"?: string | null,"enquiry_id"?: string | null,"escalated_at"?: string | null,"id"?: string,"last_message_at"?: string,"name"?: string | null,"pathway_interest"?: string | null,"phone"?: string | null,"session_token"?: string | null,"started_at"?: string,"status"?: string,"updated_at"?: string,"visitor_key"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "chatbot_conversations_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "enquiries"
      referencedColumns: ["id"]
    }
                  ]
                },"chatbot_messages": {
                  Row: {
                    "content": string,"conversation_id": string,"created_at": string,"id": string,"role": string,"tokens_in": number | null,"tokens_out": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"conversation_id": string,"created_at"?: string,"id"?: string,"role": string,"tokens_in"?: number | null,"tokens_out"?: number | null
                  }
                  Update: {
                    "content"?: string,"conversation_id"?: string,"created_at"?: string,"id"?: string,"role"?: string,"tokens_in"?: number | null,"tokens_out"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "chatbot_messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "chatbot_conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"collective_entries": {
                  Row: {
                    "body": string | null,"created_at": string,"entry_type": string,"id": string,"image_path": string | null,"published_at": string | null,"scheduled_at": string | null,"slug": string,"sort_order": number,"status": Database["public"]['Enums']["content_status"],"summary": string | null,"title": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"entry_type"?: string,"id"?: string,"image_path"?: string | null,"published_at"?: string | null,"scheduled_at"?: string | null,"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["content_status"],"summary"?: string | null,"title": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"entry_type"?: string,"id"?: string,"image_path"?: string | null,"published_at"?: string | null,"scheduled_at"?: string | null,"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["content_status"],"summary"?: string | null,"title"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "collective_entries_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"email_accounts": {
                  Row: {
                    "created_at": string,"email_address": string,"id": string,"imap_host": string | null,"imap_port": number | null,"is_default": boolean,"label": string,"last_sync_at": string | null,"provider": string,"smtp_host": string | null,"smtp_port": number | null,"sync_cursor": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email_address": string,"id"?: string,"imap_host"?: string | null,"imap_port"?: number | null,"is_default"?: boolean,"label": string,"last_sync_at"?: string | null,"provider"?: string,"smtp_host"?: string | null,"smtp_port"?: number | null,"sync_cursor"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email_address"?: string,"id"?: string,"imap_host"?: string | null,"imap_port"?: number | null,"is_default"?: boolean,"label"?: string,"last_sync_at"?: string | null,"provider"?: string,"smtp_host"?: string | null,"smtp_port"?: number | null,"sync_cursor"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"email_attachments": {
                  Row: {
                    "created_at": string,"file_name": string,"id": string,"message_id": string,"mime_type": string | null,"provider_attachment_id": string | null,"size_bytes": number | null,"storage_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"file_name": string,"id"?: string,"message_id": string,"mime_type"?: string | null,"provider_attachment_id"?: string | null,"size_bytes"?: number | null,"storage_path"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"file_name"?: string,"id"?: string,"message_id"?: string,"mime_type"?: string | null,"provider_attachment_id"?: string | null,"size_bytes"?: number | null,"storage_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_attachments_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "email_messages"
      referencedColumns: ["id"]
    }
                  ]
                },"email_drafts": {
                  Row: {
                    "account_id": string | null,"ai_meta": Json | null,"bcc_recipients": NonNullable<Json>,"body_html": string | null,"body_text": string | null,"cc_recipients": NonNullable<Json>,"created_at": string,"created_by": string | null,"enquiry_id": string | null,"id": string,"in_reply_to_message_id": string | null,"is_ai_generated": boolean,"sent_message_id": string | null,"signature_html": string | null,"status": string,"subject": string | null,"to_recipients": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_id"?: string | null,"ai_meta"?: Json | null,"bcc_recipients"?: NonNullable<Json>,"body_html"?: string | null,"body_text"?: string | null,"cc_recipients"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"enquiry_id"?: string | null,"id"?: string,"in_reply_to_message_id"?: string | null,"is_ai_generated"?: boolean,"sent_message_id"?: string | null,"signature_html"?: string | null,"status"?: string,"subject"?: string | null,"to_recipients"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "account_id"?: string | null,"ai_meta"?: Json | null,"bcc_recipients"?: NonNullable<Json>,"body_html"?: string | null,"body_text"?: string | null,"cc_recipients"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"enquiry_id"?: string | null,"id"?: string,"in_reply_to_message_id"?: string | null,"is_ai_generated"?: boolean,"sent_message_id"?: string | null,"signature_html"?: string | null,"status"?: string,"subject"?: string | null,"to_recipients"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_drafts_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "email_accounts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_drafts_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_drafts_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "enquiries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_drafts_in_reply_to_message_id_fkey"
      columns: ["in_reply_to_message_id"]
isOneToOne: false
      referencedRelation: "email_messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_drafts_sent_message_id_fkey"
      columns: ["sent_message_id"]
isOneToOne: false
      referencedRelation: "email_messages"
      referencedColumns: ["id"]
    }
                  ]
                },"email_messages": {
                  Row: {
                    "account_id": string,"bcc_recipients": NonNullable<Json>,"body_html": string | null,"body_text": string | null,"cc_recipients": NonNullable<Json>,"created_at": string,"direction": string,"enquiry_id": string | null,"folder": Database["public"]['Enums']["email_folder"],"from_email": string | null,"from_name": string | null,"has_attachments": boolean,"id": string,"is_read": boolean,"preview_text": string | null,"provider_message_id": string,"raw_headers": Json | null,"received_at": string | null,"reply_to": Json | null,"sent_at": string | null,"subject": string | null,"thread_id": string | null,"to_recipients": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_id": string,"bcc_recipients"?: NonNullable<Json>,"body_html"?: string | null,"body_text"?: string | null,"cc_recipients"?: NonNullable<Json>,"created_at"?: string,"direction"?: string,"enquiry_id"?: string | null,"folder"?: Database["public"]['Enums']["email_folder"],"from_email"?: string | null,"from_name"?: string | null,"has_attachments"?: boolean,"id"?: string,"is_read"?: boolean,"preview_text"?: string | null,"provider_message_id": string,"raw_headers"?: Json | null,"received_at"?: string | null,"reply_to"?: Json | null,"sent_at"?: string | null,"subject"?: string | null,"thread_id"?: string | null,"to_recipients"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "account_id"?: string,"bcc_recipients"?: NonNullable<Json>,"body_html"?: string | null,"body_text"?: string | null,"cc_recipients"?: NonNullable<Json>,"created_at"?: string,"direction"?: string,"enquiry_id"?: string | null,"folder"?: Database["public"]['Enums']["email_folder"],"from_email"?: string | null,"from_name"?: string | null,"has_attachments"?: boolean,"id"?: string,"is_read"?: boolean,"preview_text"?: string | null,"provider_message_id"?: string,"raw_headers"?: Json | null,"received_at"?: string | null,"reply_to"?: Json | null,"sent_at"?: string | null,"subject"?: string | null,"thread_id"?: string | null,"to_recipients"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_messages_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "email_accounts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_messages_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "enquiries"
      referencedColumns: ["id"]
    }
                  ]
                },"email_send_log": {
                  Row: {
                    "attempts": number,"created_at": string,"created_by": string | null,"draft_id": string | null,"enquiry_id": string | null,"envelope": Json | null,"error": string | null,"id": string,"message_id": string | null,"status": string,"subject": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number,"created_at"?: string,"created_by"?: string | null,"draft_id"?: string | null,"enquiry_id"?: string | null,"envelope"?: Json | null,"error"?: string | null,"id"?: string,"message_id"?: string | null,"status": string,"subject"?: string | null
                  }
                  Update: {
                    "attempts"?: number,"created_at"?: string,"created_by"?: string | null,"draft_id"?: string | null,"enquiry_id"?: string | null,"envelope"?: Json | null,"error"?: string | null,"id"?: string,"message_id"?: string | null,"status"?: string,"subject"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_send_log_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_send_log_draft_id_fkey"
      columns: ["draft_id"]
isOneToOne: false
      referencedRelation: "email_drafts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_send_log_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "enquiries"
      referencedColumns: ["id"]
    }
                  ]
                },"enquiries": {
                  Row: {
                    "assigned_to": string | null,"category": string,"created_at": string,"email": string,"id": string,"ip_hash": string | null,"is_spam": boolean,"message": string,"name": string,"pathway": string | null,"phone": string | null,"resolved_at": string | null,"responded_at": string | null,"source": string,"status": Database["public"]['Enums']["enquiry_status"],"subject": string | null,"updated_at": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"category": string,"created_at"?: string,"email": string,"id"?: string,"ip_hash"?: string | null,"is_spam"?: boolean,"message": string,"name": string,"pathway"?: string | null,"phone"?: string | null,"resolved_at"?: string | null,"responded_at"?: string | null,"source"?: string,"status"?: Database["public"]['Enums']["enquiry_status"],"subject"?: string | null,"updated_at"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "assigned_to"?: string | null,"category"?: string,"created_at"?: string,"email"?: string,"id"?: string,"ip_hash"?: string | null,"is_spam"?: boolean,"message"?: string,"name"?: string,"pathway"?: string | null,"phone"?: string | null,"resolved_at"?: string | null,"responded_at"?: string | null,"source"?: string,"status"?: Database["public"]['Enums']["enquiry_status"],"subject"?: string | null,"updated_at"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiries_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"enquiry_assignments": {
                  Row: {
                    "assigned_at": string,"assigned_by": string | null,"assigned_to": string | null,"enquiry_id": string,"id": string,"unassigned_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"assigned_to"?: string | null,"enquiry_id": string,"id"?: string,"unassigned_at"?: string | null
                  }
                  Update: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"assigned_to"?: string | null,"enquiry_id"?: string,"id"?: string,"unassigned_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiry_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enquiry_assignments_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enquiry_assignments_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "enquiries"
      referencedColumns: ["id"]
    }
                  ]
                },"enquiry_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"enquiry_id": string,"id": string,"is_internal": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"enquiry_id": string,"id"?: string,"is_internal"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"enquiry_id"?: string,"id"?: string,"is_internal"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiry_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enquiry_notes_enquiry_id_fkey"
      columns: ["enquiry_id"]
isOneToOne: false
      referencedRelation: "enquiries"
      referencedColumns: ["id"]
    }
                  ]
                },"homepage_content": {
                  Row: {
                    "created_at": string,"featured_image_path": string | null,"hero_body": string | null,"hero_cta_primary_href": string | null,"hero_cta_primary_label": string | null,"hero_cta_secondary_href": string | null,"hero_cta_secondary_label": string | null,"hero_eyebrow": string | null,"hero_headline": string | null,"hero_subheadline": string | null,"id": string,"sections": NonNullable<Json>,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"featured_image_path"?: string | null,"hero_body"?: string | null,"hero_cta_primary_href"?: string | null,"hero_cta_primary_label"?: string | null,"hero_cta_secondary_href"?: string | null,"hero_cta_secondary_label"?: string | null,"hero_eyebrow"?: string | null,"hero_headline"?: string | null,"hero_subheadline"?: string | null,"id"?: string,"sections"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"featured_image_path"?: string | null,"hero_body"?: string | null,"hero_cta_primary_href"?: string | null,"hero_cta_primary_label"?: string | null,"hero_cta_secondary_href"?: string | null,"hero_cta_secondary_label"?: string | null,"hero_eyebrow"?: string | null,"hero_headline"?: string | null,"hero_subheadline"?: string | null,"id"?: string,"sections"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "homepage_content_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"media_assets": {
                  Row: {
                    "alt_text": string | null,"caption": string | null,"category": string,"created_at": string,"file_name": string,"file_size_bytes": number,"height": number | null,"id": string,"is_featured": boolean,"mime_type": string,"public_url": string | null,"storage_path": string,"updated_at": string,"uploaded_by": string | null,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"caption"?: string | null,"category"?: string,"created_at"?: string,"file_name": string,"file_size_bytes": number,"height"?: number | null,"id"?: string,"is_featured"?: boolean,"mime_type": string,"public_url"?: string | null,"storage_path": string,"updated_at"?: string,"uploaded_by"?: string | null,"width"?: number | null
                  }
                  Update: {
                    "alt_text"?: string | null,"caption"?: string | null,"category"?: string,"created_at"?: string,"file_name"?: string,"file_size_bytes"?: number,"height"?: number | null,"id"?: string,"is_featured"?: boolean,"mime_type"?: string,"public_url"?: string | null,"storage_path"?: string,"updated_at"?: string,"uploaded_by"?: string | null,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_assets_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"is_read": boolean,"kind": Database["public"]['Enums']["notification_kind"],"link": string | null,"read_at": string | null,"recipient_id": string,"resource_id": string | null,"resource_type": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"is_read"?: boolean,"kind": Database["public"]['Enums']["notification_kind"],"link"?: string | null,"read_at"?: string | null,"recipient_id": string,"resource_id"?: string | null,"resource_type"?: string | null,"title": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"is_read"?: boolean,"kind"?: Database["public"]['Enums']["notification_kind"],"link"?: string | null,"read_at"?: string | null,"recipient_id"?: string,"resource_id"?: string | null,"resource_type"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"page_sections": {
                  Row: {
                    "body": string | null,"config": NonNullable<Json>,"created_at": string,"id": string,"is_visible": boolean,"media": NonNullable<Json>,"page_id": string,"section_key": string,"sort_order": number,"title": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"config"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_visible"?: boolean,"media"?: NonNullable<Json>,"page_id": string,"section_key": string,"sort_order"?: number,"title"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string | null,"config"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_visible"?: boolean,"media"?: NonNullable<Json>,"page_id"?: string,"section_key"?: string,"sort_order"?: number,"title"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "page_sections_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "pages"
      referencedColumns: ["id"]
    }
                  ]
                },"pages": {
                  Row: {
                    "created_at": string,"description": string | null,"hero_image_path": string | null,"id": string,"published_at": string | null,"scheduled_at": string | null,"seo_description": string | null,"seo_image_path": string | null,"seo_title": string | null,"slug": string,"status": Database["public"]['Enums']["content_status"],"title": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"hero_image_path"?: string | null,"id"?: string,"published_at"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_image_path"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"title": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"hero_image_path"?: string | null,"id"?: string,"published_at"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_image_path"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pages_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth": string,"created_at": string,"device_label": string | null,"endpoint": string,"id": string,"last_seen_at": string,"p256dh": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth": string,"created_at"?: string,"device_label"?: string | null,"endpoint": string,"id"?: string,"last_seen_at"?: string,"p256dh": string,"user_id": string
                  }
                  Update: {
                    "auth"?: string,"created_at"?: string,"device_label"?: string | null,"endpoint"?: string,"id"?: string,"last_seen_at"?: string,"p256dh"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"services": {
                  Row: {
                    "body": string | null,"created_at": string,"icon": string | null,"id": string,"pathway": string,"published_at": string | null,"scheduled_at": string | null,"seo_description": string | null,"seo_title": string | null,"slug": string,"sort_order": number,"status": Database["public"]['Enums']["content_status"],"summary": string | null,"title": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"icon"?: string | null,"id"?: string,"pathway": string,"published_at"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["content_status"],"summary"?: string | null,"title": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"icon"?: string | null,"id"?: string,"pathway"?: string,"published_at"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["content_status"],"summary"?: string | null,"title"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"site_settings": {
                  Row: {
                    "created_at": string,"is_public": boolean,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"is_public"?: boolean,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"is_public"?: boolean,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "admin_profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "current_admin_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["admin_role"]
                           },
"has_admin_role":
{ Args: { "required": Database["public"]['Enums']["admin_role"] }; Returns: boolean
                           }
          }
          Enums: {
            "admin_role": "owner"|"administrator"|"editor","admin_status": "active"|"invited"|"suspended","content_status": "draft"|"published"|"scheduled"|"unpublished","email_folder": "inbox"|"sent"|"drafts"|"archive"|"trash","enquiry_status": "new"|"in_progress"|"awaiting_response"|"resolved"|"archived","notification_kind": "enquiry"|"escalation"|"email"|"failure"|"activity"|"alert"|"system"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "admin_role": ["owner", "administrator", "editor"],"admin_status": ["active", "invited", "suspended"],"content_status": ["draft", "published", "scheduled", "unpublished"],"email_folder": ["inbox", "sent", "drafts", "archive", "trash"],"enquiry_status": ["new", "in_progress", "awaiting_response", "resolved", "archived"],"notification_kind": ["enquiry", "escalation", "email", "failure", "activity", "alert", "system"]
          }
        }
} as const
