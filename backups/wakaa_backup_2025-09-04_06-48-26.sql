--
-- PostgreSQL database dump
--

\restrict c5TZUfrJscCupIYQVk8WGtzUjZrdUL2vfDSbv1DNgDsIXTEOpuqMacCzzm7W5pX

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_customer_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_customer_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Mettre Ã  jour les statistiques du client
    UPDATE customers SET
      total_orders = (
        SELECT COUNT(*) FROM orders 
        WHERE customer_id = NEW.customer_id AND status IN ('delivered', 'paid')
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_amount), 0) FROM orders 
        WHERE customer_id = NEW.customer_id AND payment_status = 'paid'
      ),
      last_order_at = (
        SELECT MAX(create_time) FROM orders 
        WHERE customer_id = NEW.customer_id
      )
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_customer_stats() OWNER TO postgres;

--
-- Name: update_modify_time(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modify_time() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.modify_time = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_modify_time() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'admin'::character varying,
    is_active boolean DEFAULT true,
    permissions jsonb DEFAULT '{}'::jsonb,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying(255),
    last_login_at timestamp with time zone,
    password_changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'support'::character varying, 'analyst'::character varying])::text[])))
);


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_users_id_seq OWNER TO postgres;

--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: affiliate_programs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_programs (
    id bigint NOT NULL,
    affiliate_id uuid NOT NULL,
    affiliate_name character varying(255) NOT NULL,
    affiliate_email character varying(255) NOT NULL,
    referral_code character varying(50) NOT NULL,
    commission_rate numeric(5,2) DEFAULT 10.00,
    total_referrals integer DEFAULT 0,
    total_earnings numeric(15,2) DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    payment_method jsonb DEFAULT '{}'::jsonb,
    last_payout_at timestamp with time zone,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT affiliate_programs_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.affiliate_programs OWNER TO postgres;

--
-- Name: affiliate_programs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.affiliate_programs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_programs_id_seq OWNER TO postgres;

--
-- Name: affiliate_programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.affiliate_programs_id_seq OWNED BY public.affiliate_programs.id;


--
-- Name: affiliate_referrals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_referrals (
    id bigint NOT NULL,
    affiliate_id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    referral_code character varying(50) NOT NULL,
    commission_amount numeric(15,2) DEFAULT 0,
    status character varying(20) DEFAULT 'pending'::character varying,
    paid_at timestamp with time zone,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT affiliate_referrals_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'paid'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.affiliate_referrals OWNER TO postgres;

--
-- Name: affiliate_referrals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.affiliate_referrals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_referrals_id_seq OWNER TO postgres;

--
-- Name: affiliate_referrals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.affiliate_referrals_id_seq OWNED BY public.affiliate_referrals.id;


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analytics_events (
    id bigint NOT NULL,
    merchant_id bigint,
    event_type character varying(100) NOT NULL,
    event_data jsonb NOT NULL,
    user_id character varying(255),
    session_id character varying(255),
    ip_address inet,
    user_agent text,
    referrer text,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.analytics_events OWNER TO postgres;

--
-- Name: TABLE analytics_events; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.analytics_events IS 'Collecte d''Ã©vÃ©nements pour business intelligence';


--
-- Name: analytics_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analytics_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_events_id_seq OWNER TO postgres;

--
-- Name: analytics_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analytics_events_id_seq OWNED BY public.analytics_events.id;


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_keys (
    id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    key_hash character varying(255) NOT NULL,
    key_prefix character varying(20) NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    last_used_at timestamp with time zone,
    usage_count integer DEFAULT 0,
    rate_limit integer DEFAULT 1000,
    expires_at timestamp with time zone,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.api_keys OWNER TO postgres;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.api_keys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_keys_id_seq OWNER TO postgres;

--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_type character varying(20) NOT NULL,
    user_id character varying(255) NOT NULL,
    user_email character varying(255),
    action character varying(100) NOT NULL,
    resource_type character varying(100),
    resource_id character varying(255),
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_logs_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['merchant'::character varying, 'admin'::character varying, 'system'::character varying])::text[])))
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    phone_number character varying(20) NOT NULL,
    name character varying(255),
    email character varying(255),
    address text,
    city character varying(100),
    notes text,
    total_orders integer DEFAULT 0,
    total_spent numeric(15,2) DEFAULT 0,
    last_order_at timestamp with time zone,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: TABLE customers; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.customers IS 'Base de donnÃ©es clients pour chaque marchand (CRM)';


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: merchant_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.merchant_settings (
    id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    notification_preferences jsonb DEFAULT '{}'::jsonb,
    business_hours jsonb DEFAULT '{}'::jsonb,
    auto_reply_enabled boolean DEFAULT true,
    auto_reply_message text,
    order_confirmation_template text,
    payment_reminder_template text,
    delivery_notification_template text,
    tax_rate numeric(5,2) DEFAULT 0,
    shipping_fee numeric(10,2) DEFAULT 0,
    minimum_order_amount numeric(10,2) DEFAULT 0,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.merchant_settings OWNER TO postgres;

--
-- Name: merchant_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.merchant_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.merchant_settings_id_seq OWNER TO postgres;

--
-- Name: merchant_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.merchant_settings_id_seq OWNED BY public.merchant_settings.id;


--
-- Name: merchants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.merchants (
    id bigint NOT NULL,
    business_name character varying(255) NOT NULL,
    whatsapp_number character varying(20) NOT NULL,
    email character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    subscription_plan character varying(100) DEFAULT 'free'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    city character varying(100),
    country character varying(100) DEFAULT 'Cameroon'::character varying,
    currency character varying(10) DEFAULT 'FCFA'::character varying,
    timezone character varying(50) DEFAULT 'Africa/Douala'::character varying,
    trial_ends_at timestamp with time zone,
    settings jsonb DEFAULT '{}'::jsonb,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT merchants_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'trial'::character varying])::text[])))
);


ALTER TABLE public.merchants OWNER TO postgres;

--
-- Name: TABLE merchants; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.merchants IS 'Informations des entreprises utilisant la plateforme Wakaa';


--
-- Name: merchants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.merchants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.merchants_id_seq OWNER TO postgres;

--
-- Name: merchants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.merchants_id_seq OWNED BY public.merchants.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'FCFA'::character varying,
    provider character varying(50) NOT NULL,
    transaction_id character varying(255),
    external_transaction_id character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_method character varying(50),
    customer_phone character varying(20),
    webhook_data jsonb,
    failure_reason text,
    processed_at timestamp with time zone,
    expires_at timestamp with time zone,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_provider_check CHECK (((provider)::text = ANY ((ARRAY['cinetpay'::character varying, 'mtn_momo'::character varying, 'orange_money'::character varying, 'manual'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: TABLE payments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.payments IS 'Transactions de paiement avec intÃ©gration CinetPay et mobile money';


--
-- Name: monthly_revenue; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_revenue AS
 SELECT m.id AS merchant_id,
    m.business_name,
    date_trunc('month'::text, p.processed_at) AS month,
    count(p.id) AS total_payments,
    sum(p.amount) AS total_revenue,
    avg(p.amount) AS average_payment
   FROM (public.merchants m
     LEFT JOIN public.payments p ON (((m.id = p.merchant_id) AND ((p.status)::text = 'completed'::text))))
  GROUP BY m.id, m.business_name, (date_trunc('month'::text, p.processed_at))
  ORDER BY (date_trunc('month'::text, p.processed_at)) DESC;


ALTER VIEW public.monthly_revenue OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    merchant_id bigint,
    customer_id bigint,
    order_id bigint,
    type character varying(100) NOT NULL,
    channel character varying(50) NOT NULL,
    recipient character varying(255) NOT NULL,
    subject character varying(255),
    message text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    error_message text,
    metadata jsonb,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_channel_check CHECK (((channel)::text = ANY ((ARRAY['whatsapp'::character varying, 'sms'::character varying, 'email'::character varying, 'push'::character varying, 'in_app'::character varying])::text[]))),
    CONSTRAINT notifications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'delivered'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['order_created'::character varying, 'payment_received'::character varying, 'order_shipped'::character varying, 'order_delivered'::character varying, 'subscription_expiring'::character varying, 'system_alert'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notifications IS 'SystÃ¨me de notifications multi-canal (WhatsApp, SMS, Email)';


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id bigint,
    product_name character varying(255) NOT NULL,
    product_sku character varying(100),
    quantity integer NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    total_price numeric(15,2) NOT NULL,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    order_number character varying(100) NOT NULL,
    merchant_id bigint NOT NULL,
    customer_id bigint NOT NULL,
    items jsonb NOT NULL,
    subtotal_amount numeric(15,2) NOT NULL,
    tax_amount numeric(15,2) DEFAULT 0,
    shipping_amount numeric(15,2) DEFAULT 0,
    total_amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'FCFA'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    payment_id bigint,
    shipping_address jsonb,
    notes text,
    whatsapp_message_id character varying(255),
    source character varying(50) DEFAULT 'whatsapp'::character varying,
    delivery_date timestamp with time zone,
    tracking_number character varying(255),
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT orders_source_check CHECK (((source)::text = ANY ((ARRAY['whatsapp'::character varying, 'web'::character varying, 'api'::character varying, 'manual'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'paid'::character varying, 'processing'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: TABLE orders; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.orders IS 'Commandes passÃ©es par les clients via WhatsApp ou autres canaux';


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    provider character varying(50) NOT NULL,
    method_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    configuration jsonb DEFAULT '{}'::jsonb,
    fees jsonb DEFAULT '{}'::jsonb,
    supported_currencies jsonb DEFAULT '["FCFA"]'::jsonb,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_methods_provider_check CHECK (((provider)::text = ANY ((ARRAY['cinetpay'::character varying, 'mtn_momo'::character varying, 'orange_money'::character varying, 'bank_transfer'::character varying, 'cash'::character varying])::text[])))
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_methods_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_methods_id_seq OWNER TO postgres;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(15,2) NOT NULL,
    image_url text,
    category character varying(100),
    stock_quantity integer DEFAULT 0,
    is_active boolean DEFAULT true,
    sku character varying(100),
    weight numeric(8,2),
    dimensions jsonb,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: TABLE products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.products IS 'Catalogue de produits pour chaque marchand';


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'merchant'::character varying,
    avatar_url text,
    phone_number character varying(20),
    address text,
    city character varying(100),
    country character varying(100) DEFAULT 'Cameroon'::character varying,
    timezone character varying(50) DEFAULT 'Africa/Douala'::character varying,
    language character varying(10) DEFAULT 'fr'::character varying,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    two_factor_enabled boolean DEFAULT false,
    preferences jsonb DEFAULT '{}'::jsonb,
    last_login_at timestamp with time zone,
    password_changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT profiles_role_check CHECK (((role)::text = ANY ((ARRAY['merchant'::character varying, 'customer'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: TABLE profiles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.profiles IS 'Table principale des utilisateurs avec authentification et profils';


--
-- Name: qr_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qr_codes (
    id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    code character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    url text NOT NULL,
    qr_image_url text,
    title character varying(255),
    description text,
    is_active boolean DEFAULT true,
    scan_count integer DEFAULT 0,
    last_scanned_at timestamp with time zone,
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT qr_codes_type_check CHECK (((type)::text = ANY ((ARRAY['order_link'::character varying, 'product'::character varying, 'catalog'::character varying, 'contact'::character varying, 'payment'::character varying])::text[])))
);


ALTER TABLE public.qr_codes OWNER TO postgres;

--
-- Name: qr_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qr_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qr_codes_id_seq OWNER TO postgres;

--
-- Name: qr_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qr_codes_id_seq OWNED BY public.qr_codes.id;


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'FCFA'::character varying,
    billing_cycle character varying(20) DEFAULT 'monthly'::character varying,
    orders_limit integer,
    products_limit integer,
    customers_limit integer,
    features jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscription_plans_billing_cycle_check CHECK (((billing_cycle)::text = ANY ((ARRAY['monthly'::character varying, 'yearly'::character varying])::text[])))
);


ALTER TABLE public.subscription_plans OWNER TO postgres;

--
-- Name: TABLE subscription_plans; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.subscription_plans IS 'Plans d''abonnement disponibles sur la plateforme';


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscription_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscription_plans_id_seq OWNER TO postgres;

--
-- Name: subscription_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscription_plans_id_seq OWNED BY public.subscription_plans.id;


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    plan_type character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    next_billing_date timestamp with time zone,
    price numeric(10,2),
    currency character varying(10) DEFAULT 'FCFA'::character varying,
    billing_cycle character varying(20) DEFAULT 'monthly'::character varying,
    orders_limit integer,
    orders_used integer DEFAULT 0,
    features jsonb DEFAULT '{}'::jsonb,
    auto_renew boolean DEFAULT true,
    cancelled_at timestamp with time zone,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'suspended'::character varying])::text[])))
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: TABLE subscriptions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.subscriptions IS 'Abonnements actifs des marchands';


--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscriptions_id_seq OWNER TO postgres;

--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id bigint NOT NULL,
    ticket_number character varying(100) NOT NULL,
    merchant_id bigint NOT NULL,
    subject character varying(255) NOT NULL,
    description text NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying,
    priority character varying(20) DEFAULT 'medium'::character varying,
    category character varying(50),
    assigned_to bigint,
    first_response_at timestamp with time zone,
    resolved_at timestamp with time zone,
    attachments jsonb DEFAULT '[]'::jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT support_tickets_category_check CHECK (((category)::text = ANY ((ARRAY['technical'::character varying, 'billing'::character varying, 'feature_request'::character varying, 'bug_report'::character varying, 'account'::character varying, 'integration'::character varying, 'training'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT support_tickets_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT support_tickets_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'waiting_customer'::character varying, 'resolved'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: support_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.support_tickets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_tickets_id_seq OWNER TO postgres;

--
-- Name: support_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_tickets_id_seq OWNED BY public.support_tickets.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id bigint NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    description text,
    category character varying(50) DEFAULT 'general'::character varying,
    is_public boolean DEFAULT false,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: top_products; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.top_products AS
 SELECT p.merchant_id,
    p.id AS product_id,
    p.name AS product_name,
    count(oi.id) AS total_sales,
    sum(oi.quantity) AS total_quantity,
    sum(oi.total_price) AS total_revenue
   FROM ((public.products p
     LEFT JOIN public.order_items oi ON ((p.id = oi.product_id)))
     LEFT JOIN public.orders o ON (((oi.order_id = o.id) AND ((o.status)::text = ANY ((ARRAY['delivered'::character varying, 'paid'::character varying])::text[])))))
  GROUP BY p.merchant_id, p.id, p.name
  ORDER BY (count(oi.id)) DESC;


ALTER VIEW public.top_products OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id bigint NOT NULL,
    merchant_id character varying(255) NOT NULL,
    session_token character varying(255) NOT NULL,
    device_info jsonb,
    ip_address inet,
    user_agent text,
    is_active boolean DEFAULT true,
    last_activity_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone NOT NULL,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: webhooks_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhooks_log (
    id bigint NOT NULL,
    source character varying(50) NOT NULL,
    event_type character varying(100) NOT NULL,
    payload jsonb NOT NULL,
    headers jsonb,
    signature_verified boolean DEFAULT false,
    status character varying(20) DEFAULT 'received'::character varying,
    error_message text,
    processed_at timestamp with time zone,
    payment_id bigint,
    order_id bigint,
    create_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT webhooks_log_source_check CHECK (((source)::text = ANY ((ARRAY['whatsapp'::character varying, 'cinetpay'::character varying, 'mtn_momo'::character varying, 'orange_money'::character varying])::text[]))),
    CONSTRAINT webhooks_log_status_check CHECK (((status)::text = ANY ((ARRAY['received'::character varying, 'processing'::character varying, 'processed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.webhooks_log OWNER TO postgres;

--
-- Name: TABLE webhooks_log; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.webhooks_log IS 'Journalisation des webhooks pour debugging et audit';


--
-- Name: webhooks_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.webhooks_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhooks_log_id_seq OWNER TO postgres;

--
-- Name: webhooks_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.webhooks_log_id_seq OWNED BY public.webhooks_log.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: affiliate_programs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_programs ALTER COLUMN id SET DEFAULT nextval('public.affiliate_programs_id_seq'::regclass);


--
-- Name: affiliate_referrals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_referrals ALTER COLUMN id SET DEFAULT nextval('public.affiliate_referrals_id_seq'::regclass);


--
-- Name: analytics_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_events ALTER COLUMN id SET DEFAULT nextval('public.analytics_events_id_seq'::regclass);


--
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: merchant_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchant_settings ALTER COLUMN id SET DEFAULT nextval('public.merchant_settings_id_seq'::regclass);


--
-- Name: merchants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchants ALTER COLUMN id SET DEFAULT nextval('public.merchants_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: qr_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_codes ALTER COLUMN id SET DEFAULT nextval('public.qr_codes_id_seq'::regclass);


--
-- Name: subscription_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans ALTER COLUMN id SET DEFAULT nextval('public.subscription_plans_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: support_tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN id SET DEFAULT nextval('public.support_tickets_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: webhooks_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks_log ALTER COLUMN id SET DEFAULT nextval('public.webhooks_log_id_seq'::regclass);


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_users (id, email, password_hash, name, role, is_active, permissions, two_factor_enabled, two_factor_secret, last_login_at, password_changed_at, create_time, modify_time) FROM stdin;
1	admin@wakaa.io	hashed_adminpass_1234567890	Admin Wakaa	super_admin	t	{"users": {"read": true, "write": true, "delete": true}, "system": {"read": true, "write": true}, "merchants": {"read": true, "write": true, "delete": true}}	f	\N	\N	2025-09-04 06:32:58.222845+01	2025-09-04 06:32:58.222845+01	2025-09-04 06:32:58.222845+01
\.


--
-- Data for Name: affiliate_programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliate_programs (id, affiliate_id, affiliate_name, affiliate_email, referral_code, commission_rate, total_referrals, total_earnings, status, payment_method, last_payout_at, create_time, modify_time) FROM stdin;
\.


--
-- Data for Name: affiliate_referrals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliate_referrals (id, affiliate_id, merchant_id, referral_code, commission_amount, status, paid_at, create_time, modify_time) FROM stdin;
\.


--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analytics_events (id, merchant_id, event_type, event_data, user_id, session_id, ip_address, user_agent, referrer, create_time) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_keys (id, merchant_id, name, key_hash, key_prefix, permissions, is_active, last_used_at, usage_count, rate_limit, expires_at, create_time, modify_time) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_type, user_id, user_email, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, create_time) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, merchant_id, phone_number, name, email, address, city, notes, total_orders, total_spent, last_order_at, create_time, modify_time) FROM stdin;
10	3	+237671111111	Client Test 1	client1@test.com	\N	Douala	\N	1	15000.00	2025-09-04 06:41:54.175441+01	2025-09-04 06:40:07.362349+01	2025-09-04 06:41:54.175441+01
11	3	+237672222222	Client Test 2	client2@test.com	\N	Douala	\N	0	0.00	2025-09-04 06:41:54.175441+01	2025-09-04 06:40:07.362349+01	2025-09-04 06:41:54.175441+01
12	4	+237673333333	Client Test 3	client3@test.com	\N	YaoundÃ©	\N	0	35000.00	2025-09-04 06:41:54.175441+01	2025-09-04 06:40:07.362349+01	2025-09-04 06:41:54.175441+01
13	4	+237674444444	Client Test 4	client4@test.com	\N	YaoundÃ©	\N	0	28000.00	2025-09-04 06:41:54.175441+01	2025-09-04 06:40:07.362349+01	2025-09-04 06:41:54.175441+01
\.


--
-- Data for Name: merchant_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.merchant_settings (id, merchant_id, notification_preferences, business_hours, auto_reply_enabled, auto_reply_message, order_confirmation_template, payment_reminder_template, delivery_notification_template, tax_rate, shipping_fee, minimum_order_amount, create_time, modify_time) FROM stdin;
7	3	{}	{}	t	Merci pour votre message ! Nous vous rÃ©pondrons rapidement.	\N	\N	\N	0.00	2000.00	5000.00	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
8	4	{}	{}	t	Bienvenue chez Marie Fashion ! Comment puis-je vous aider ?	\N	\N	\N	0.00	1500.00	10000.00	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
\.


--
-- Data for Name: merchants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.merchants (id, business_name, whatsapp_number, email, slug, subscription_plan, status, city, country, currency, timezone, trial_ends_at, settings, create_time, modify_time) FROM stdin;
3	Boutique Jean	+237670123456	merchant1@wakaa.cm	boutique-jean	standard	active	Douala	Cameroon	FCFA	Africa/Douala	\N	{}	2025-09-04 06:38:45.038232+01	2025-09-04 06:38:45.038232+01
4	Marie Fashion	+237680234567	merchant2@wakaa.cm	marie-fashion	premium	active	YaoundÃ©	Cameroon	FCFA	Africa/Douala	\N	{}	2025-09-04 06:38:45.038232+01	2025-09-04 06:38:45.038232+01
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, merchant_id, customer_id, order_id, type, channel, recipient, subject, message, status, sent_at, delivered_at, error_message, metadata, create_time, modify_time) FROM stdin;
10	3	10	14	order_created	whatsapp	+237671111111	Commande confirmée	Votre commande WK-2025-001 a été confirmée	delivered	\N	\N	\N	\N	2025-09-04 06:43:58.108721+01	2025-09-04 06:43:58.108721+01
11	4	12	16	order_shipped	whatsapp	+237673333333	Commande expédiée	Votre commande WK-2025-003 a été expédiée	delivered	\N	\N	\N	\N	2025-09-04 06:43:58.108721+01	2025-09-04 06:43:58.108721+01
12	4	13	17	payment_received	whatsapp	+237674444444	Paiement reçu	Paiement reçu pour WK-2025-004	delivered	\N	\N	\N	\N	2025-09-04 06:43:58.108721+01	2025-09-04 06:43:58.108721+01
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, create_time, modify_time) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, merchant_id, customer_id, items, subtotal_amount, tax_amount, shipping_amount, total_amount, currency, status, payment_status, payment_id, shipping_address, notes, whatsapp_message_id, source, delivery_date, tracking_number, create_time, modify_time) FROM stdin;
14	WK-2025-001	3	10	{"items": [{"qty": 1, "name": "T-shirt", "price": 15000}]}	15000.00	0.00	0.00	15000.00	FCFA	delivered	paid	\N	\N	\N	\N	whatsapp	\N	\N	2025-09-04 06:41:54.175441+01	2025-09-04 06:41:54.175441+01
15	WK-2025-002	3	11	{"items": [{"qty": 1, "name": "Jean", "price": 25000}]}	25000.00	0.00	0.00	25000.00	FCFA	pending	pending	\N	\N	\N	\N	whatsapp	\N	\N	2025-09-04 06:41:54.175441+01	2025-09-04 06:41:54.175441+01
16	WK-2025-003	4	12	{"items": [{"qty": 1, "name": "Robe", "price": 35000}]}	35000.00	0.00	0.00	35000.00	FCFA	shipped	paid	\N	\N	\N	\N	whatsapp	\N	\N	2025-09-04 06:41:54.175441+01	2025-09-04 06:41:54.175441+01
17	WK-2025-004	4	13	{"items": [{"qty": 1, "name": "Sac", "price": 28000}]}	28000.00	0.00	0.00	28000.00	FCFA	processing	paid	\N	\N	\N	\N	whatsapp	\N	\N	2025-09-04 06:41:54.175441+01	2025-09-04 06:41:54.175441+01
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_methods (id, merchant_id, provider, method_name, is_active, configuration, fees, supported_currencies, create_time, modify_time) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, order_id, merchant_id, amount, currency, provider, transaction_id, external_transaction_id, status, payment_method, customer_phone, webhook_data, failure_reason, processed_at, expires_at, create_time, modify_time) FROM stdin;
14	14	3	15000.00	FCFA	cinetpay	CP_TXN_001	\N	completed	mtn_momo	\N	\N	\N	\N	\N	2025-09-04 06:43:58.108721+01	2025-09-04 06:43:58.108721+01
15	16	4	35000.00	FCFA	cinetpay	CP_TXN_002	\N	completed	orange_money	\N	\N	\N	\N	\N	2025-09-04 06:43:58.108721+01	2025-09-04 06:43:58.108721+01
16	17	4	28000.00	FCFA	manual	MANUAL_001	\N	completed	cash	\N	\N	\N	\N	\N	2025-09-04 06:43:58.108721+01	2025-09-04 06:43:58.108721+01
17	15	3	25000.00	FCFA	cinetpay	CP_TXN_003	\N	pending	mtn_momo	\N	\N	\N	\N	\N	2025-09-04 06:43:58.108721+01	2025-09-04 06:43:58.108721+01
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, merchant_id, name, description, price, image_url, category, stock_quantity, is_active, sku, weight, dimensions, create_time, modify_time) FROM stdin;
14	3	T-shirt Coton Premium	T-shirt en coton de qualitÃ© supÃ©rieure	15000.00	https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400	VÃªtements	50	t	TSH001	\N	\N	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
15	3	Jean Slim Fit	Jean slim fit moderne et confortable	25000.00	https://images.unsplash.com/photo-1542272604-787c3835535d?w=400	VÃªtements	30	t	JEA001	\N	\N	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
16	3	Sneakers Sport	Chaussures de sport confortables	45000.00	https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400	Chaussures	20	t	SNE001	\N	\N	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
17	4	Robe Ã‰lÃ©gante	Robe Ã©lÃ©gante pour soirÃ©e	35000.00	https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400	VÃªtements	15	t	ROB001	\N	\N	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
18	4	Sac Ã  Main Cuir	Sac Ã  main en cuir vÃ©ritable	28000.00	https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400	Accessoires	25	t	SAC001	\N	\N	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
19	4	Bijoux Fantaisie	Collection de bijoux tendance	12000.00	https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400	Accessoires	40	t	BIJ001	\N	\N	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, email, password_hash, full_name, role, avatar_url, phone_number, address, city, country, timezone, language, is_active, email_verified, phone_verified, two_factor_enabled, preferences, last_login_at, password_changed_at, create_time, modify_time) FROM stdin;
550e8400-e29b-41d4-a716-446655440001	admin@wakaa.cm	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS	Admin Wakaa	admin	\N	+237670000001	\N	\N	Cameroon	Africa/Douala	fr	t	t	f	f	{}	\N	2025-09-04 06:38:45.002397+01	2025-09-04 06:38:45.002397+01	2025-09-04 06:38:45.002397+01
550e8400-e29b-41d4-a716-446655440002	merchant1@wakaa.cm	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS	Jean Boutique	merchant	\N	+237670000002	\N	\N	Cameroon	Africa/Douala	fr	t	t	f	f	{}	\N	2025-09-04 06:38:45.002397+01	2025-09-04 06:38:45.002397+01	2025-09-04 06:38:45.002397+01
550e8400-e29b-41d4-a716-446655440003	merchant2@wakaa.cm	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A5/jF3kkS	Marie Fashion	merchant	\N	+237670000003	\N	\N	Cameroon	Africa/Douala	fr	t	t	f	f	{}	\N	2025-09-04 06:38:45.002397+01	2025-09-04 06:38:45.002397+01	2025-09-04 06:38:45.002397+01
\.


--
-- Data for Name: qr_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.qr_codes (id, merchant_id, code, type, url, qr_image_url, title, description, is_active, scan_count, last_scanned_at, expires_at, metadata, create_time, modify_time) FROM stdin;
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_plans (id, name, display_name, description, price, currency, billing_cycle, orders_limit, products_limit, customers_limit, features, is_active, sort_order, create_time, modify_time) FROM stdin;
1	free	Gratuit	Plan gratuit pour dÃ©buter avec Wakaa	0.00	FCFA	monthly	10	\N	\N	{"email_support": false, "basic_analytics": true, "customer_management": true, "whatsapp_integration": true}	t	1	2025-09-04 06:32:58.199405+01	2025-09-04 06:32:58.199405+01
2	standard	Standard	Plan standard pour entreprises en croissance	5000.00	FCFA	monthly	500	\N	\N	{"email_support": true, "basic_analytics": true, "advanced_analytics": true, "customer_management": true, "payment_integration": true, "whatsapp_integration": true}	t	2	2025-09-04 06:32:58.199405+01	2025-09-04 06:32:58.199405+01
3	premium	Premium	Plan premium pour entreprises Ã©tablies	10000.00	FCFA	monthly	\N	\N	\N	{"api_access": true, "priority_support": true, "unlimited_orders": true, "advanced_analytics": true, "custom_integrations": true, "whatsapp_integration": true}	t	3	2025-09-04 06:32:58.199405+01	2025-09-04 06:32:58.199405+01
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, merchant_id, plan_type, status, start_date, end_date, next_billing_date, price, currency, billing_cycle, orders_limit, orders_used, features, auto_renew, cancelled_at, create_time, modify_time) FROM stdin;
8	3	standard	active	2025-08-20 06:40:07.362349+01	2025-09-19 06:40:07.362349+01	2025-09-19 06:40:07.362349+01	5000.00	FCFA	monthly	500	25	{}	t	\N	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
9	4	premium	active	2025-08-25 06:40:07.362349+01	2025-09-24 06:40:07.362349+01	2025-09-24 06:40:07.362349+01	10000.00	FCFA	monthly	-1	12	{}	t	\N	2025-09-04 06:40:07.362349+01	2025-09-04 06:40:07.362349+01
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_tickets (id, ticket_number, merchant_id, subject, description, status, priority, category, assigned_to, first_response_at, resolved_at, attachments, tags, create_time, modify_time) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, key, value, description, category, is_public, create_time, modify_time) FROM stdin;
1	app_name	"Wakaa"	Nom de l'application	general	t	2025-09-04 06:32:58.204649+01	2025-09-04 06:32:58.204649+01
2	app_version	"1.0.0"	Version de l'application	general	t	2025-09-04 06:32:58.204649+01	2025-09-04 06:32:58.204649+01
3	maintenance_mode	false	Mode maintenance activÃ©	general	f	2025-09-04 06:32:58.204649+01	2025-09-04 06:32:58.204649+01
4	max_file_size	10485760	Taille maximale des fichiers (10MB)	uploads	f	2025-09-04 06:32:58.204649+01	2025-09-04 06:32:58.204649+01
5	default_currency	"FCFA"	Devise par dÃ©faut	business	t	2025-09-04 06:32:58.204649+01	2025-09-04 06:32:58.204649+01
6	default_timezone	"Africa/Douala"	Fuseau horaire par dÃ©faut	general	t	2025-09-04 06:32:58.204649+01	2025-09-04 06:32:58.204649+01
7	whatsapp_webhook_token	"wakaa_webhook_token"	Token de vÃ©rification WhatsApp	integrations	f	2025-09-04 06:32:58.204649+01	2025-09-04 06:32:58.204649+01
8	cinetpay_environment	"sandbox"	Environnement CinetPay (sandbox/live)	payments	f	2025-09-04 06:32:58.204649+01	2025-09-04 06:32:58.204649+01
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, merchant_id, session_token, device_info, ip_address, user_agent, is_active, last_activity_at, expires_at, create_time, modify_time) FROM stdin;
\.


--
-- Data for Name: webhooks_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhooks_log (id, source, event_type, payload, headers, signature_verified, status, error_message, processed_at, payment_id, order_id, create_time) FROM stdin;
1	whatsapp	message_received	{"from": "+237671111111", "message": "Je veux commander", "timestamp": "2025-01-03T10:30:00Z"}	\N	t	processed	\N	2025-09-04 04:36:48.287278+01	\N	\N	2025-09-04 06:36:48.287278+01
2	cinetpay	payment_completed	{"amount": 42000, "status": "completed", "transaction_id": "CP_TXN_001"}	\N	t	processed	\N	2025-09-02 06:36:48.287278+01	\N	\N	2025-09-04 06:36:48.287278+01
3	cinetpay	payment_completed	{"amount": 65000, "status": "completed", "transaction_id": "CP_TXN_002"}	\N	t	processed	\N	2025-09-03 06:36:48.287278+01	\N	\N	2025-09-04 06:36:48.287278+01
4	whatsapp	message_received	{"from": "+237671111111", "message": "Je veux commander", "timestamp": "2025-01-03T10:30:00Z"}	\N	t	processed	\N	2025-09-04 04:38:45.416638+01	\N	\N	2025-09-04 06:38:45.416638+01
5	cinetpay	payment_completed	{"amount": 42000, "status": "completed", "transaction_id": "CP_TXN_001"}	\N	t	processed	\N	2025-09-02 06:38:45.416638+01	\N	\N	2025-09-04 06:38:45.416638+01
6	cinetpay	payment_completed	{"amount": 65000, "status": "completed", "transaction_id": "CP_TXN_002"}	\N	t	processed	\N	2025-09-03 06:38:45.416638+01	\N	\N	2025-09-04 06:38:45.416638+01
7	whatsapp	message_received	{"from": "+237671111111", "message": "Je veux commander", "timestamp": "2025-01-03T10:30:00Z"}	\N	t	processed	\N	2025-09-04 04:40:07.758317+01	\N	\N	2025-09-04 06:40:07.758317+01
8	cinetpay	payment_completed	{"amount": 42000, "status": "completed", "transaction_id": "CP_TXN_001"}	\N	t	processed	\N	2025-09-02 06:40:07.758317+01	\N	\N	2025-09-04 06:40:07.758317+01
9	cinetpay	payment_completed	{"amount": 65000, "status": "completed", "transaction_id": "CP_TXN_002"}	\N	t	processed	\N	2025-09-03 06:40:07.758317+01	\N	\N	2025-09-04 06:40:07.758317+01
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 1, true);


--
-- Name: affiliate_programs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.affiliate_programs_id_seq', 1, false);


--
-- Name: affiliate_referrals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.affiliate_referrals_id_seq', 1, false);


--
-- Name: analytics_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analytics_events_id_seq', 1, false);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 13, true);


--
-- Name: merchant_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.merchant_settings_id_seq', 8, true);


--
-- Name: merchants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.merchants_id_seq', 4, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 12, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 20, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 17, true);


--
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 3, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 17, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 19, true);


--
-- Name: qr_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.qr_codes_id_seq', 1, false);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscription_plans_id_seq', 3, true);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 9, true);


--
-- Name: support_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_tickets_id_seq', 1, false);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 8, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 1, false);


--
-- Name: webhooks_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.webhooks_log_id_seq', 9, true);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: affiliate_programs affiliate_programs_affiliate_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_programs
    ADD CONSTRAINT affiliate_programs_affiliate_email_key UNIQUE (affiliate_email);


--
-- Name: affiliate_programs affiliate_programs_affiliate_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_programs
    ADD CONSTRAINT affiliate_programs_affiliate_id_key UNIQUE (affiliate_id);


--
-- Name: affiliate_programs affiliate_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_programs
    ADD CONSTRAINT affiliate_programs_pkey PRIMARY KEY (id);


--
-- Name: affiliate_programs affiliate_programs_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_programs
    ADD CONSTRAINT affiliate_programs_referral_code_key UNIQUE (referral_code);


--
-- Name: affiliate_referrals affiliate_referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_referrals
    ADD CONSTRAINT affiliate_referrals_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: customers customers_merchant_id_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_merchant_id_phone_number_key UNIQUE (merchant_id, phone_number);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: merchant_settings merchant_settings_merchant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchant_settings
    ADD CONSTRAINT merchant_settings_merchant_id_key UNIQUE (merchant_id);


--
-- Name: merchant_settings merchant_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchant_settings
    ADD CONSTRAINT merchant_settings_pkey PRIMARY KEY (id);


--
-- Name: merchants merchants_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_email_key UNIQUE (email);


--
-- Name: merchants merchants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_pkey PRIMARY KEY (id);


--
-- Name: merchants merchants_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_slug_key UNIQUE (slug);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: qr_codes qr_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_code_key UNIQUE (code);


--
-- Name: qr_codes qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ticket_number_key UNIQUE (ticket_number);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: webhooks_log webhooks_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks_log
    ADD CONSTRAINT webhooks_log_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_users_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_active ON public.admin_users USING btree (is_active);


--
-- Name: idx_admin_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_email ON public.admin_users USING btree (email);


--
-- Name: idx_admin_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_role ON public.admin_users USING btree (role);


--
-- Name: idx_affiliate_programs_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_affiliate_programs_code ON public.affiliate_programs USING btree (referral_code);


--
-- Name: idx_affiliate_programs_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_affiliate_programs_email ON public.affiliate_programs USING btree (affiliate_email);


--
-- Name: idx_affiliate_programs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_affiliate_programs_status ON public.affiliate_programs USING btree (status);


--
-- Name: idx_affiliate_referrals_affiliate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_affiliate_referrals_affiliate ON public.affiliate_referrals USING btree (affiliate_id);


--
-- Name: idx_affiliate_referrals_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_affiliate_referrals_merchant ON public.affiliate_referrals USING btree (merchant_id);


--
-- Name: idx_affiliate_referrals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_affiliate_referrals_status ON public.affiliate_referrals USING btree (status);


--
-- Name: idx_analytics_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analytics_date ON public.analytics_events USING btree (create_time);


--
-- Name: idx_analytics_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analytics_merchant ON public.analytics_events USING btree (merchant_id);


--
-- Name: idx_analytics_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analytics_type ON public.analytics_events USING btree (event_type);


--
-- Name: idx_api_keys_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_keys_active ON public.api_keys USING btree (is_active, expires_at);


--
-- Name: idx_api_keys_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_keys_merchant ON public.api_keys USING btree (merchant_id);


--
-- Name: idx_api_keys_prefix; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_keys_prefix ON public.api_keys USING btree (key_prefix);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_date ON public.audit_logs USING btree (create_time DESC);


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_type, user_id);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_customers_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_merchant ON public.customers USING btree (merchant_id);


--
-- Name: idx_customers_orders; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_orders ON public.customers USING btree (total_orders DESC);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone_number);


--
-- Name: idx_merchant_settings_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_merchant_settings_merchant ON public.merchant_settings USING btree (merchant_id);


--
-- Name: idx_merchants_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_merchants_email ON public.merchants USING btree (email);


--
-- Name: idx_merchants_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_merchants_slug ON public.merchants USING btree (slug);


--
-- Name: idx_merchants_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_merchants_status ON public.merchants USING btree (status);


--
-- Name: idx_merchants_whatsapp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_merchants_whatsapp ON public.merchants USING btree (whatsapp_number);


--
-- Name: idx_notifications_channel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_channel ON public.notifications USING btree (channel);


--
-- Name: idx_notifications_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_customer ON public.notifications USING btree (customer_id);


--
-- Name: idx_notifications_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_merchant ON public.notifications USING btree (merchant_id);


--
-- Name: idx_notifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_status ON public.notifications USING btree (status);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_order_items_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_product ON public.order_items USING btree (product_id);


--
-- Name: idx_orders_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);


--
-- Name: idx_orders_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_date ON public.orders USING btree (create_time DESC);


--
-- Name: idx_orders_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_merchant ON public.orders USING btree (merchant_id);


--
-- Name: idx_orders_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_number ON public.orders USING btree (order_number);


--
-- Name: idx_orders_payment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_payment_status ON public.orders USING btree (payment_status);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_payment_methods_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_active ON public.payment_methods USING btree (merchant_id, is_active);


--
-- Name: idx_payment_methods_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_merchant ON public.payment_methods USING btree (merchant_id);


--
-- Name: idx_payments_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_merchant ON public.payments USING btree (merchant_id);


--
-- Name: idx_payments_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);


--
-- Name: idx_payments_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_provider ON public.payments USING btree (provider);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_payments_transaction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_transaction ON public.payments USING btree (transaction_id);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_active ON public.products USING btree (merchant_id, is_active);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_merchant ON public.products USING btree (merchant_id);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku);


--
-- Name: idx_profiles_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_active ON public.profiles USING btree (is_active);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone_number);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- Name: idx_qr_codes_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_codes_active ON public.qr_codes USING btree (is_active);


--
-- Name: idx_qr_codes_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_codes_code ON public.qr_codes USING btree (code);


--
-- Name: idx_qr_codes_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_codes_merchant ON public.qr_codes USING btree (merchant_id);


--
-- Name: idx_qr_codes_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_codes_type ON public.qr_codes USING btree (type);


--
-- Name: idx_sessions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_active ON public.user_sessions USING btree (is_active, expires_at);


--
-- Name: idx_sessions_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_merchant ON public.user_sessions USING btree (merchant_id);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_token ON public.user_sessions USING btree (session_token);


--
-- Name: idx_subscription_plans_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscription_plans_active ON public.subscription_plans USING btree (is_active, sort_order);


--
-- Name: idx_subscriptions_billing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_billing ON public.subscriptions USING btree (next_billing_date);


--
-- Name: idx_subscriptions_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_merchant ON public.subscriptions USING btree (merchant_id);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_support_tickets_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_tickets_assigned ON public.support_tickets USING btree (assigned_to);


--
-- Name: idx_support_tickets_merchant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_tickets_merchant ON public.support_tickets USING btree (merchant_id);


--
-- Name: idx_support_tickets_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_tickets_priority ON public.support_tickets USING btree (priority);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_system_settings_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_settings_category ON public.system_settings USING btree (category);


--
-- Name: idx_system_settings_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_settings_key ON public.system_settings USING btree (key);


--
-- Name: idx_system_settings_public; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_settings_public ON public.system_settings USING btree (is_public);


--
-- Name: idx_webhooks_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhooks_date ON public.webhooks_log USING btree (create_time DESC);


--
-- Name: idx_webhooks_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhooks_source ON public.webhooks_log USING btree (source);


--
-- Name: idx_webhooks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhooks_status ON public.webhooks_log USING btree (status);


--
-- Name: orders update_customer_stats_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customer_stats_trigger AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();


--
-- Name: customers update_customers_modify_time; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customers_modify_time BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_modify_time();


--
-- Name: merchants update_merchants_modify_time; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_merchants_modify_time BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.update_modify_time();


--
-- Name: notifications update_notifications_modify_time; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_notifications_modify_time BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_modify_time();


--
-- Name: orders update_orders_modify_time; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_orders_modify_time BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_modify_time();


--
-- Name: payments update_payments_modify_time; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_payments_modify_time BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_modify_time();


--
-- Name: products update_products_modify_time; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_modify_time BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_modify_time();


--
-- Name: profiles update_profiles_modify_time; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_modify_time BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_modify_time();


--
-- Name: subscriptions update_subscriptions_modify_time; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_subscriptions_modify_time BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_modify_time();


--
-- Name: affiliate_referrals affiliate_referrals_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_referrals
    ADD CONSTRAINT affiliate_referrals_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliate_programs(id) ON DELETE CASCADE;


--
-- Name: affiliate_referrals affiliate_referrals_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_referrals
    ADD CONSTRAINT affiliate_referrals_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: analytics_events analytics_events_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: customers customers_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: orders fk_orders_payment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;


--
-- Name: merchant_settings merchant_settings_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchant_settings
    ADD CONSTRAINT merchant_settings_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: merchants merchants_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_email_fkey FOREIGN KEY (email) REFERENCES public.profiles(email) ON DELETE CASCADE;


--
-- Name: merchants merchants_subscription_plan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_subscription_plan_fkey FOREIGN KEY (subscription_plan) REFERENCES public.subscription_plans(name) ON DELETE SET DEFAULT;


--
-- Name: notifications notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: orders orders_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: payments payments_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: products products_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: qr_codes qr_codes_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_plan_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_type_fkey FOREIGN KEY (plan_type) REFERENCES public.subscription_plans(name) ON DELETE RESTRICT;


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.admin_users(id) ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: webhooks_log webhooks_log_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks_log
    ADD CONSTRAINT webhooks_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: webhooks_log webhooks_log_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks_log
    ADD CONSTRAINT webhooks_log_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;


--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: customers merchant_customers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY merchant_customers ON public.customers USING ((merchant_id IN ( SELECT merchants.id
   FROM public.merchants
  WHERE ((merchants.email)::text = current_setting('app.current_user_email'::text, true)))));


--
-- Name: orders merchant_orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY merchant_orders ON public.orders USING ((merchant_id IN ( SELECT merchants.id
   FROM public.merchants
  WHERE ((merchants.email)::text = current_setting('app.current_user_email'::text, true)))));


--
-- Name: merchants merchant_own_data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY merchant_own_data ON public.merchants USING (((email)::text = current_setting('app.current_user_email'::text, true)));


--
-- Name: profiles merchant_own_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY merchant_own_profile ON public.profiles USING (((id)::text = current_setting('app.current_user_id'::text, true)));


--
-- Name: payments merchant_payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY merchant_payments ON public.payments USING ((merchant_id IN ( SELECT merchants.id
   FROM public.merchants
  WHERE ((merchants.email)::text = current_setting('app.current_user_email'::text, true)))));


--
-- Name: products merchant_products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY merchant_products ON public.products USING ((merchant_id IN ( SELECT merchants.id
   FROM public.merchants
  WHERE ((merchants.email)::text = current_setting('app.current_user_email'::text, true)))));


--
-- Name: merchant_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.merchant_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: merchants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict c5TZUfrJscCupIYQVk8WGtzUjZrdUL2vfDSbv1DNgDsIXTEOpuqMacCzzm7W5pX

