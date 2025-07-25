# Subscription & Monetization System

##  Subscription Overview

JobPilot implements a sophisticated freemium subscription model that balances user accessibility with revenue generation. The system provides clear value propositions for each tier while maintaining fair usage limits.

##  Subscription Tiers

### 1. Free Plan
- **Price**: \.00/month
- **Daily Application Limit**: 5 companies
- **Duration**: Unlimited
- **Target Users**: Casual job seekers, students, entry-level professionals

#### Features Included:
-  Basic job search and filtering
-  AI-powered job recommendations (limited)
-  Profile creation and management
-  Standard customer support
-  Email notifications
-  Basic analytics dashboard

#### Limitations:
-  Limited to 5 applications per day
-  Basic search filters only
-  Standard support response time
-  No priority job visibility
-  Limited AI recommendation frequency

### 2. Standard Plan
- **Price**: \.99/month
- **Daily Application Limit**: 10 companies
- **Duration**: 30 days
- **Target Users**: Active job seekers, career changers

#### Features Included:
-  All Free Plan features
-  Enhanced job search with advanced filters
-  Priority customer support
-  Advanced analytics dashboard
-  Resume optimization suggestions
-  Real-time job alerts
-  Company research tools

#### Enhanced Features:
-  2x daily application limit
-  Advanced search and filtering
-  Priority support (24-48h response)
-  Enhanced AI recommendations
-  Detailed application tracking

### 3. Premium Plan
- **Price**: \.99/month
- **Daily Application Limit**: 25 companies
- **Duration**: 30 days
- **Target Users**: Senior professionals, executives, high-volume applicants

#### Features Included:
-  All Standard Plan features
-  Custom branding (profile themes)
-  API access for integrations
-  Advanced analytics and insights
-  Priority job placement
-  Dedicated account support
-  Interview scheduling assistance

#### Premium Features:
-  5x daily application limit
-  Custom profile branding
-  API access and integrations
-  Priority support (12-24h response)
-  Advanced career insights
-  Exclusive job opportunities

### 4. Enterprise Plan
- **Price**: \.99/month
- **Daily Application Limit**: 100 companies
- **Duration**: 30 days
- **Target Users**: Executive search, recruitment agencies, large organizations

#### Features Included:
-  All Premium Plan features
-  Unlimited job search capabilities
-  24/7 priority support
-  Advanced analytics dashboard
-  Custom branding and white-labeling
-  Dedicated account manager
-  Custom integrations and API access

#### Enterprise Features:
-  20x daily application limit
-  24/7 dedicated support
-  Custom integrations
-  White-label options
-  Advanced reporting and analytics
-  Dedicated account manager

##  Technical Implementation

### Database Models

#### SubscriptionPlan Model
`python
class SubscriptionPlan(BaseModel):
    name = CharField(max_length=100)
    description = TextField()
    price = DecimalField(max_digits=10, decimal_places=2)
    duration_days = IntegerField()
    daily_application_limit = IntegerField(default=5)
    plan_type = CharField(choices=PLAN_TYPES, default='free')
    
    # Feature flags
    priority_support = BooleanField(default=False)
    advanced_analytics = BooleanField(default=False)
    custom_branding = BooleanField(default=False)
    api_access = BooleanField(default=False)
    
    features = JSONField(default=list)
    is_active = BooleanField(default=True)
`

#### UserSubscription Model
`python
class UserSubscription(BaseModel):
    user = ForeignKey(User, on_delete=CASCADE)
    plan = ForeignKey(SubscriptionPlan, on_delete=CASCADE)
    start_date = DateTimeField()
    end_date = DateTimeField()
    status = CharField(choices=STATUS_CHOICES, default='active')
    is_active = BooleanField(default=True)
    auto_renew = BooleanField(default=True)
    
    @property
    def is_expired(self):
        return timezone.now() > self.end_date
    
    @property
    def days_remaining(self):
        if self.is_expired:
            return 0
        return (self.end_date - timezone.now()).days
`

#### DailyApplicationUsage Model
`python
class DailyApplicationUsage(BaseModel):
    user = ForeignKey(User, on_delete=CASCADE)
    date = DateField()
    applications_count = IntegerField(default=0)
    companies_applied = JSONField(default=list)
    
    def can_apply_to_company(self, company_id, daily_limit):
        # Check if already applied to company today
        if company_id in self.companies_applied:
            return False
        # Check daily limit
        return self.applications_count < daily_limit
`

### Subscription Management Service

#### Core Service Methods
`python
class SubscriptionService:
    @staticmethod
    def get_user_active_subscription(user):
        """Get user's current active subscription"""
        return UserSubscription.objects.filter(
            user=user,
            is_active=True,
            status='active',
            end_date__gt=timezone.now()
        ).latest('created_at')
    
    @staticmethod
    def get_daily_application_limit(user):
        """Get user's daily application limit"""
        subscription = self.get_user_active_subscription(user)
        if subscription:
            return subscription.plan.daily_application_limit
        # Default to free plan limit
        return 5
    
    @staticmethod
    def can_apply_to_job(user, job):
        """Check if user can apply to specific job"""
        daily_limit = self.get_daily_application_limit(user)
        usage = DailyApplicationUsage.get_or_create_today(user)
        company_id = str(job.company.id)
        return usage.can_apply_to_company(company_id, daily_limit)
    
    @staticmethod
    def create_subscription(user, plan, start_date=None, end_date=None):
        """Create new subscription for user"""
        # Deactivate existing subscriptions
        UserSubscription.objects.filter(
            user=user, is_active=True
        ).update(is_active=False, status='cancelled')
        
        # Create new subscription
        if start_date is None:
            start_date = timezone.now()
        if end_date is None:
            end_date = start_date + timedelta(days=plan.duration_days)
        
        return UserSubscription.objects.create(
            user=user,
            plan=plan,
            start_date=start_date,
            end_date=end_date,
            is_active=True,
            status='active'
        )
`

##  Usage Tracking & Enforcement

### Application Limit Enforcement

#### Real-time Validation
`python
def apply_to_job(request, job_id):
    user = request.user
    job = get_object_or_404(JobPosting, id=job_id)
    
    # Check subscription limits
    if not SubscriptionService.can_apply_to_job(user, job):
        return Response({
            'error': 'Daily application limit reached',
            'upgrade_required': True,
            'current_limit': SubscriptionService.get_daily_application_limit(user)
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Process application
    application = JobApplication.objects.create(
        job=job,
        applicant=user,
        # ... other fields
    )
    
    # Update usage tracking
    SubscriptionService.record_application(user, job)
    
    return Response(ApplicationSerializer(application).data)
`

#### Usage Analytics
`python
def get_usage_summary(user):
    """Get comprehensive usage summary"""
    usage = DailyApplicationUsage.get_or_create_today(user)
    daily_limit = SubscriptionService.get_daily_application_limit(user)
    
    return {
        'used_today': usage.applications_count,
        'remaining_today': max(0, daily_limit - usage.applications_count),
        'daily_limit': daily_limit,
        'companies_applied': usage.companies_applied,
        'usage_percentage': (usage.applications_count / daily_limit) * 100
    }
`

### Subscription Status API

#### Status Endpoint
`python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    """Get comprehensive subscription status"""
    user = request.user
    status_data = SubscriptionService.get_subscription_status(user)
    
    return Response({
        'has_active_subscription': status_data['has_active_subscription'],
        'plan_name': status_data['plan_name'],
        'plan_type': status_data['plan_type'],
        'daily_limit': status_data['daily_limit'],
        'used_today': status_data['used_today'],
        'remaining_today': status_data['remaining_today'],
        'subscription_end_date': status_data['subscription_end_date'],
        'days_remaining': status_data['days_remaining'],
        'is_expired': status_data['is_expired'],
        'features': status_data['features'],
        'price': status_data['price'],
    })
`

##  Revenue Analytics

### Revenue Tracking

#### Monthly Revenue Calculation
`python
def calculate_monthly_revenue():
    """Calculate current monthly recurring revenue"""
    active_subscriptions = UserSubscription.objects.filter(
        is_active=True,
        status='active'
    ).select_related('plan')
    
    monthly_revenue = sum(
        subscription.plan.price 
        for subscription in active_subscriptions
    )
    
    return float(monthly_revenue)
`

#### Subscription Analytics
`python
def get_subscription_analytics():
    """Get comprehensive subscription analytics"""
    total_subscriptions = UserSubscription.objects.count()
    active_subscriptions = UserSubscription.objects.filter(
        is_active=True, status='active'
    ).count()
    
    # Plan distribution
    plan_distribution = {}
    for plan in SubscriptionPlan.objects.filter(is_active=True):
        count = UserSubscription.objects.filter(
            plan=plan, is_active=True, status='active'
        ).count()
        plan_distribution[plan.name] = count
    
    return {
        'total_subscriptions': total_subscriptions,
        'active_subscriptions': active_subscriptions,
        'monthly_revenue': calculate_monthly_revenue(),
        'plan_distribution': plan_distribution,
        'conversion_rate': (active_subscriptions / total_users) * 100
    }
`

##  User Experience Features

### Frontend Subscription Management

#### Subscription Dashboard
`	sx
const SubscriptionDashboard: React.FC = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  
  useEffect(() => {
    fetchSubscriptionStatus();
    fetchAvailablePlans();
  }, []);
  
  const handleUpgrade = async (planId: string) => {
    try {
      const response = await fetch('/api/v1/subscriptions/subscribe/', {
        method: 'POST',
        headers: {
          'Authorization': Bearer ,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          auto_renew: true
        }),
      });
      
      if (response.ok) {
        // Handle successful upgrade
        fetchSubscriptionStatus();
        showSuccessMessage('Subscription upgraded successfully!');
      }
    } catch (error) {
      showErrorMessage('Failed to upgrade subscription');
    }
  };
  
  return (
    <div className="subscription-dashboard">
      {/* Current plan status */}
      <SubscriptionStatus status={subscriptionStatus} />
      
      {/* Usage tracking */}
      <UsageTracking 
        used={subscriptionStatus?.used_today}
        limit={subscriptionStatus?.daily_limit}
      />
      
      {/* Available plans */}
      <PlanSelection 
        plans={availablePlans}
        currentPlan={subscriptionStatus?.plan_type}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};
`

#### Usage Warning Component
`	sx
const SubscriptionLimitWarning: React.FC = () => {
  const { subscriptionStatus } = useSubscription();
  
  if (subscriptionStatus?.remaining_today <= 1) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
          <div>
            <h3 className="text-yellow-800 font-medium">
              Daily Application Limit Almost Reached
            </h3>
            <p className="text-yellow-700 text-sm">
              You have {subscriptionStatus.remaining_today} application(s) remaining today.
              <Link href="/subscription" className="underline ml-1">
                Upgrade your plan
              </Link> for unlimited applications.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};
`

##  Admin Management

### Admin Subscription Controls

#### Admin Dashboard Features
- **Subscription Overview**: Total revenue, active subscriptions, plan distribution
- **User Management**: View and modify user subscriptions
- **Plan Management**: Create, edit, and deactivate subscription plans
- **Usage Analytics**: Monitor application usage and limit enforcement
- **Revenue Tracking**: Monthly recurring revenue and growth metrics

#### Admin API Endpoints
`python
# Admin-only subscription management
urlpatterns = [
    path('admin/plans/', AdminSubscriptionPlanViewSet.as_view()),
    path('admin/subscriptions/', AdminUserSubscriptionViewSet.as_view()),
    path('admin/analytics/', admin_subscription_analytics),
    path('admin/expired/', check_expired_subscriptions),
]
`

##  Future Payment Integration

### Payment Gateway Preparation

#### Razorpay Integration (Planned)
`python
# Payment processing structure
class PaymentProcessor:
    def create_subscription_payment(self, user, plan):
        """Create payment order with Razorpay"""
        # Implementation for payment gateway
        pass
    
    def handle_payment_success(self, payment_id, subscription_data):
        """Handle successful payment callback"""
        # Activate subscription after payment
        pass
    
    def handle_payment_failure(self, payment_id, error_data):
        """Handle failed payment callback"""
        # Log failure and notify user
        pass
`

#### Webhook Handling
`python
@csrf_exempt
def payment_webhook(request):
    """Handle payment gateway webhooks"""
    # Verify webhook signature
    # Process payment status updates
    # Update subscription status
    pass
`

##  Success Metrics

### Key Performance Indicators (KPIs)

#### Financial Metrics
- **Monthly Recurring Revenue (MRR)**: Currently tracking \.96
- **Average Revenue Per User (ARPU)**: Revenue per active subscriber
- **Customer Lifetime Value (CLV)**: Long-term subscriber value
- **Churn Rate**: Subscription cancellation rate

#### Usage Metrics
- **Application Conversion Rate**: Subscription upgrades from limit hits
- **Feature Adoption**: Usage of premium features
- **User Engagement**: Platform activity by subscription tier
- **Support Satisfaction**: Customer service ratings

#### Growth Metrics
- **Subscription Growth Rate**: Month-over-month growth
- **Plan Upgrade Rate**: Conversions between tiers
- **Free-to-Paid Conversion**: Free plan upgrade rate
- **Retention Rate**: Subscription renewal percentage

### Analytics Dashboard
- **Real-time Revenue**: Live MRR tracking
- **Subscription Funnel**: Conversion rates by stage
- **Usage Patterns**: Application patterns by plan
- **Cohort Analysis**: User behavior over time
- **Predictive Analytics**: Churn prediction and prevention
