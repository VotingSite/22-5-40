import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Calendar,
  Trophy,
  BookOpen,
  Download,
  UserPlus,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  joinedDate: Date;
  lastActive: Date;
  testsCompleted: number;
  averageScore: number;
  status: 'active' | 'inactive' | 'suspended';
  totalTimeSpent: string;
}

const statusColors = {
  active: "bg-success/20 text-success",
  inactive: "bg-muted/20 text-muted-foreground",
  suspended: "bg-danger/20 text-danger"
};

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const mounted = useRef(true);

  // Form state for creating/editing students
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active' as Student['status']
  });

  useEffect(() => {
    fetchStudents();
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchStudents = async () => {
    try {
      if (!mounted.current) return;

      setLoading(true);
      setError(null);

      // Fetch users collection
      const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));

      if (!mounted.current) return;

      const usersData = usersSnapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data(),
          joinedDate: doc.data().createdAt?.toDate() || new Date(),
          lastActive: doc.data().lastLogin?.toDate() || new Date()
        };
      });

      // Get test attempts for calculating statistics
      const attemptsSnapshot = await getDocs(collection(db, 'testAttempts'));

      if (!mounted.current) return;

      const attempts = attemptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate statistics for each student
      const studentsWithStats = usersData.map(user => {
        const userAttempts = attempts.filter(attempt => attempt.userId === user.id);
        const completedAttempts = userAttempts.filter(attempt => attempt.status === 'completed' && attempt.score !== undefined);

        const testsCompleted = completedAttempts.length;
        const averageScore = testsCompleted > 0
          ? Math.round(completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / testsCompleted)
          : 0;

        // Calculate total time spent (simplified)
        const totalMinutes = userAttempts.reduce((sum, attempt) => {
          const duration = attempt.duration || 0;
          return sum + (typeof duration === 'number' ? duration : 0);
        }, 0);

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalTimeSpent = `${hours}h ${minutes}m`;

        return {
          ...user,
          testsCompleted,
          averageScore,
          totalTimeSpent,
          status: user.status || 'active'
        } as Student;
      });

      if (!mounted.current) return;

      setStudents(studentsWithStats);
    } catch (error) {
      console.error('Error fetching students:', error);
      if (!mounted.current) return;

      setError(error instanceof Error ? error.message : 'Failed to fetch students');
      toast({
        title: "Error",
        description: "Failed to fetch students. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const handleCreateStudent = async () => {
    try {
      if (!formData.name || !formData.email) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const studentData = {
        name: formData.name,
        email: formData.email,
        role: 'student',
        status: formData.status,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      await addDoc(collection(db, 'users'), studentData);
      
      toast({
        title: "Success",
        description: "Student created successfully"
      });

      setShowCreateDialog(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: "Error",
        description: "Failed to create student",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
      await updateDoc(doc(db, 'users', studentId), updates);
      
      toast({
        title: "Success",
        description: "Student updated successfully"
      });

      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: "Failed to update student",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteDoc(doc(db, 'users', studentId));
      
      toast({
        title: "Success",
        description: "Student deleted successfully"
      });

      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      status: 'active'
    });
  };

  const handleExportData = () => {
    const csvData = students.map(student => ({
      Name: student.name,
      Email: student.email,
      Status: student.status,
      'Joined Date': student.joinedDate.toLocaleDateString(),
      'Tests Completed': student.testsCompleted,
      'Average Score': student.averageScore + '%',
      'Total Time': student.totalTimeSpent
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(csvData[0]).join(',') + '\n'
      + csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Student data exported successfully"
    });
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const avgTestsCompleted = students.length > 0 
    ? (students.reduce((sum, s) => sum + s.testsCompleted, 0) / students.length).toFixed(1)
    : '0';
  const avgScore = students.length > 0 
    ? (students.reduce((sum, s) => sum + s.averageScore, 0) / students.length).toFixed(1)
    : '0';

  // Add error boundary
  if (error) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Student Management</h1>
          <p className="text-muted-foreground text-lg">Manage and monitor student accounts</p>
        </motion.div>

        <AnimatedCard delay={0.2}>
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Students</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => {
              setError(null);
              fetchStudents();
            }}>
              Try Again
            </Button>
          </div>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-4">Student Management</h1>
        <p className="text-muted-foreground text-lg">Manage and monitor student accounts</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Students", value: totalStudents.toString(), change: "Registered users", icon: Users, gradient: "from-primary to-secondary" },
          { title: "Active Students", value: activeStudents.toString(), change: `${Math.round((activeStudents/totalStudents) * 100) || 0}% active`, icon: Trophy, gradient: "from-secondary to-accent" },
          { title: "Avg. Tests Completed", value: avgTestsCompleted, change: "Per student", icon: BookOpen, gradient: "from-accent to-primary" },
          { title: "Avg. Score", value: `${avgScore}%`, change: "Overall performance", icon: Trophy, gradient: "from-primary to-accent" }
        ].map((stat, index) => (
          <AnimatedCard key={stat.title} delay={index * 0.1} glow>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
                <p className="text-xs text-success font-medium">{stat.change}</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-glow`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Filters and Actions */}
      <AnimatedCard delay={0.5}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-gradient-primary" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
      </AnimatedCard>

      {/* Students Table */}
      <AnimatedCard delay={0.6}>
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border">
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Tests Completed</TableHead>
                  <TableHead>Average Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="border-glass-border hover:bg-background-secondary transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={student.avatar || ''} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{student.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{student.joinedDate.toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{student.lastActive.toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{student.testsCompleted}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-3 h-3 text-success" />
                        <span className="text-sm font-medium text-success">
                          {student.testsCompleted > 0 ? `${student.averageScore}%` : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[student.status]}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedStudent(student)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStudent(student.id, { status: student.status === 'active' ? 'inactive' : 'active' })}>
                            <Edit className="w-4 h-4 mr-2" />
                            Toggle Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-danger"
                            onClick={() => handleDeleteStudent(student.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>

            {filteredStudents.length === 0 && !loading && (
              <div className="text-center py-20">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No students found</h3>
                <p className="text-muted-foreground mb-4">
                  {students.length === 0 
                    ? "Start by adding your first student to the platform."
                    : "Try adjusting your search filters to find what you're looking for."
                  }
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Student
                </Button>
              </div>
            )}
          </div>
        )}
      </AnimatedCard>

      {/* Create Student Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-primary" />
              Add New Student
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter student's full name"
              />
            </div>

            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter student's email"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Student['status'] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleCreateStudent} className="bg-gradient-primary">
                <Save className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Details Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedStudent.avatar || ''} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {selectedStudent.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge className={`mt-1 ${statusColors[selectedStudent.status]}`}>
                      {selectedStudent.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                    <p className="text-sm mt-1">{selectedStudent.joinedDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Active</label>
                    <p className="text-sm mt-1">{selectedStudent.lastActive.toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tests Completed</label>
                    <p className="text-sm mt-1 font-medium">{selectedStudent.testsCompleted}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Average Score</label>
                    <p className="text-sm mt-1 font-medium text-success">
                      {selectedStudent.testsCompleted > 0 ? `${selectedStudent.averageScore}%` : 'No tests taken'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Time Spent</label>
                    <p className="text-sm mt-1 font-medium">{selectedStudent.totalTimeSpent}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                  Close
                </Button>
                <Button 
                  className="bg-gradient-primary"
                  onClick={() => handleUpdateStudent(selectedStudent.id, { status: selectedStudent.status === 'active' ? 'inactive' : 'active' })}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Toggle Status
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
