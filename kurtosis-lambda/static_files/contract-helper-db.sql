-- NOTE: Because the contract-helper doesn't have an up-to-date Postgres Docker image with all the tables initialized,
--  this was created by running pg_dump on a database that was initialized by cloning contract-helper (https://github.com/near/near-contract-helper)
--  and running 'yarn migrate' against a fresh Postgres DB
-- The longterm fix here is for the contract-helper repo to publish an up-to-date Postgres image
-- ~ ktoday, 2021-09-21

--
-- PostgreSQL database dump
--

-- Dumped from database version 13.4
-- Dumped by pg_dump version 13.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AccountByPublicKeys; Type: TABLE; Schema: public; Owner: helper
--

CREATE TABLE public."AccountByPublicKeys" (
    id integer NOT NULL,
    "accountId" character varying(255),
    "publicKey" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."AccountByPublicKeys" OWNER TO helper;

--
-- Name: AccountByPublicKeys_id_seq; Type: SEQUENCE; Schema: public; Owner: helper
--

CREATE SEQUENCE public."AccountByPublicKeys_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."AccountByPublicKeys_id_seq" OWNER TO helper;

--
-- Name: AccountByPublicKeys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: helper
--

ALTER SEQUENCE public."AccountByPublicKeys_id_seq" OWNED BY public."AccountByPublicKeys".id;


--
-- Name: Accounts; Type: TABLE; Schema: public; Owner: helper
--

CREATE TABLE public."Accounts" (
    id integer NOT NULL,
    "accountId" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "fundedAccountNeedsDeposit" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Accounts" OWNER TO helper;

--
-- Name: Accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: helper
--

CREATE SEQUENCE public."Accounts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Accounts_id_seq" OWNER TO helper;

--
-- Name: Accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: helper
--

ALTER SEQUENCE public."Accounts_id_seq" OWNED BY public."Accounts".id;


--
-- Name: EmailDomainBlacklist; Type: TABLE; Schema: public; Owner: helper
--

CREATE TABLE public."EmailDomainBlacklist" (
    "domainName" character varying(255) NOT NULL,
    "isTemporaryEmailService" boolean,
    "hasValidDNSMXRecord" boolean,
    error character varying(255),
    "staleAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."EmailDomainBlacklist" OWNER TO helper;

--
-- Name: IdentityVerificationMethods; Type: TABLE; Schema: public; Owner: helper
--

CREATE TABLE public."IdentityVerificationMethods" (
    id integer NOT NULL,
    "identityKey" character varying(255) NOT NULL,
    kind character varying(255) NOT NULL,
    "securityCode" character varying(255),
    claimed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "uniqueIdentityKey" character varying(255),
    CONSTRAINT kind_constraint_identity_verification_method CHECK (((kind)::text = ANY ((ARRAY['email'::character varying, 'phone'::character varying])::text[])))
);


ALTER TABLE public."IdentityVerificationMethods" OWNER TO helper;

--
-- Name: IdentityVerificationMethods_id_seq; Type: SEQUENCE; Schema: public; Owner: helper
--

CREATE SEQUENCE public."IdentityVerificationMethods_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."IdentityVerificationMethods_id_seq" OWNER TO helper;

--
-- Name: IdentityVerificationMethods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: helper
--

ALTER SEQUENCE public."IdentityVerificationMethods_id_seq" OWNED BY public."IdentityVerificationMethods".id;


--
-- Name: RecoveryMethods; Type: TABLE; Schema: public; Owner: helper
--

CREATE TABLE public."RecoveryMethods" (
    id integer NOT NULL,
    "AccountId" integer NOT NULL,
    kind character varying(255) NOT NULL,
    detail character varying(255),
    "publicKey" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "securityCode" character varying(255),
    "requestId" integer,
    CONSTRAINT kind_constraint CHECK (((kind)::text = ANY ((ARRAY['email'::character varying, 'phone'::character varying, 'phrase'::character varying, 'ledger'::character varying, '2fa-email'::character varying, '2fa-phone'::character varying])::text[])))
);


ALTER TABLE public."RecoveryMethods" OWNER TO helper;

--
-- Name: RecoveryMethods_id_seq; Type: SEQUENCE; Schema: public; Owner: helper
--

CREATE SEQUENCE public."RecoveryMethods_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."RecoveryMethods_id_seq" OWNER TO helper;

--
-- Name: RecoveryMethods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: helper
--

ALTER SEQUENCE public."RecoveryMethods_id_seq" OWNED BY public."RecoveryMethods".id;


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: helper
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO helper;

--
-- Name: AccountByPublicKeys id; Type: DEFAULT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."AccountByPublicKeys" ALTER COLUMN id SET DEFAULT nextval('public."AccountByPublicKeys_id_seq"'::regclass);


--
-- Name: Accounts id; Type: DEFAULT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."Accounts" ALTER COLUMN id SET DEFAULT nextval('public."Accounts_id_seq"'::regclass);


--
-- Name: IdentityVerificationMethods id; Type: DEFAULT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."IdentityVerificationMethods" ALTER COLUMN id SET DEFAULT nextval('public."IdentityVerificationMethods_id_seq"'::regclass);


--
-- Name: RecoveryMethods id; Type: DEFAULT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."RecoveryMethods" ALTER COLUMN id SET DEFAULT nextval('public."RecoveryMethods_id_seq"'::regclass);


--
-- Data for Name: AccountByPublicKeys; Type: TABLE DATA; Schema: public; Owner: helper
--

COPY public."AccountByPublicKeys" (id, "accountId", "publicKey", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Accounts; Type: TABLE DATA; Schema: public; Owner: helper
--

COPY public."Accounts" (id, "accountId", "createdAt", "updatedAt", "fundedAccountNeedsDeposit") FROM stdin;
\.


--
-- Data for Name: EmailDomainBlacklist; Type: TABLE DATA; Schema: public; Owner: helper
--

COPY public."EmailDomainBlacklist" ("domainName", "isTemporaryEmailService", "hasValidDNSMXRecord", error, "staleAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: IdentityVerificationMethods; Type: TABLE DATA; Schema: public; Owner: helper
--

COPY public."IdentityVerificationMethods" (id, "identityKey", kind, "securityCode", claimed, "createdAt", "updatedAt", "uniqueIdentityKey") FROM stdin;
\.


--
-- Data for Name: RecoveryMethods; Type: TABLE DATA; Schema: public; Owner: helper
--

COPY public."RecoveryMethods" (id, "AccountId", kind, detail, "publicKey", "createdAt", "updatedAt", "securityCode", "requestId") FROM stdin;
\.


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: helper
--

COPY public."SequelizeMeta" (name) FROM stdin;
20190430081305-create-account.js
20200107042702-add-email.js
20200304211820-drop-duplicate-accountIds.js
20200304211821-unique-accountId.js
20200325154731-add-recovery-methods.js
20200325204048-constrain-recoverymethods.js
20200325204238-mv-data-from-accounts-to-recoverymethods.js
20200325213728-drop-phone-and-email-from-accounts.js
20200429204207-move-security-code-to-recovery-methods.js
20200430184429-contrain-recoverymethod-unique-kind-detail.js
20200630005719-update-recoverymethod-contraint.js
20200706223822-alter-recoverymethod-add-request_id.js
20200707220356-recoverymethods-requestId-string2int.js
20200902061948-create-account-by-public-key.js
20200903055112-recoverymethod-ledger.js
20210607051723-add-fundedAccountNeedsDeposit-to-accounts.js
20210909003022-add-IdentityVerificationMethods.js
20210909003422-add-IdentityVerificationMethods-constraints.js
20210917010954-addUniqueIdentityKey.js
20210917011012-add-IdentityVerificationMethods-unique-identityKey-constraint.js
20210918010656-addEmailDomainBlacklist.js
\.


--
-- Name: AccountByPublicKeys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: helper
--

SELECT pg_catalog.setval('public."AccountByPublicKeys_id_seq"', 1, false);


--
-- Name: Accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: helper
--

SELECT pg_catalog.setval('public."Accounts_id_seq"', 1, false);


--
-- Name: IdentityVerificationMethods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: helper
--

SELECT pg_catalog.setval('public."IdentityVerificationMethods_id_seq"', 1, false);


--
-- Name: RecoveryMethods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: helper
--

SELECT pg_catalog.setval('public."RecoveryMethods_id_seq"', 1, false);


--
-- Name: AccountByPublicKeys AccountByPublicKeys_pkey; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."AccountByPublicKeys"
    ADD CONSTRAINT "AccountByPublicKeys_pkey" PRIMARY KEY (id);


--
-- Name: Accounts Accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."Accounts"
    ADD CONSTRAINT "Accounts_pkey" PRIMARY KEY (id);


--
-- Name: EmailDomainBlacklist EmailDomainBlacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."EmailDomainBlacklist"
    ADD CONSTRAINT "EmailDomainBlacklist_pkey" PRIMARY KEY ("domainName");


--
-- Name: IdentityVerificationMethods IdentityVerificationMethods_pkey; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."IdentityVerificationMethods"
    ADD CONSTRAINT "IdentityVerificationMethods_pkey" PRIMARY KEY (id);


--
-- Name: RecoveryMethods RecoveryMethods_pkey; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."RecoveryMethods"
    ADD CONSTRAINT "RecoveryMethods_pkey" PRIMARY KEY (id);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: RecoveryMethods constraint_publicKey_kind_detail; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."RecoveryMethods"
    ADD CONSTRAINT "constraint_publicKey_kind_detail" UNIQUE ("AccountId", "publicKey", kind, detail);


--
-- Name: RecoveryMethods unique_constraint; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."RecoveryMethods"
    ADD CONSTRAINT unique_constraint UNIQUE ("AccountId", kind, "publicKey");


--
-- Name: IdentityVerificationMethods unique_constraint_identityKey_verification_method; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."IdentityVerificationMethods"
    ADD CONSTRAINT "unique_constraint_identityKey_verification_method" UNIQUE ("uniqueIdentityKey");


--
-- Name: IdentityVerificationMethods unique_constraint_identity_verification_method; Type: CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."IdentityVerificationMethods"
    ADD CONSTRAINT unique_constraint_identity_verification_method UNIQUE ("identityKey");


--
-- Name: accounts_account_id; Type: INDEX; Schema: public; Owner: helper
--

CREATE UNIQUE INDEX accounts_account_id ON public."Accounts" USING btree ("accountId");


--
-- Name: RecoveryMethods RecoveryMethods_AccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: helper
--

ALTER TABLE ONLY public."RecoveryMethods"
    ADD CONSTRAINT "RecoveryMethods_AccountId_fkey" FOREIGN KEY ("AccountId") REFERENCES public."Accounts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--